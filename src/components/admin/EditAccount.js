import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext'
import { getDoc, doc, getDocs, collection, updateDoc, query, orderBy, where } from 'firebase/firestore';
import axios from 'axios';

export default function EditAccount() {
    const location = useLocation()
    const { sendPwdResetEmail } = UserAuth()

    const [originalDetails, setOriginalDetails] = useState({})
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [gender, setGender] = useState('')
    const [region, setRegion] = useState('')
    const [sports, setSports] = useState([])

    const [sportsList, setSportsList] = useState([])
    const genders = ["male", "female"]
    const regions = ["North", "Central", "East", "West", "North-East"]

    const errorMessageContent = {
        'invalid-username': "Username already in use",
        'invalid-email': 'Email already in use',
        'staff-email': 'Invalid Email address',
    }
    const [errorMessage, setErrorMessage] = useState('')


    useEffect(() => {
        const getSports = async () => {
            try {
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data()}))
                setSportsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getAccount = async () => {
            try {
                const res = await getDoc(doc(db, 'accounts', location.state.id))
                const resList = res.data()
                setOriginalDetails(resList)

                setUsername(resList.username)
                setFullName(resList.fullName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
                setEmail(resList.email)
                setGender(resList.gender)
                setRegion(resList.region)
                setSports(resList.sportInterests)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
        getAccount()
    }, [])

    const concatSports = (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )
    }

    const resetPassword = () => {
        sendPwdResetEmail(originalDetails.email).then(() => {
            window.alert('Password reset email sent')
        }).catch((err) => {
            console.error(err)
        })
    }

    const updateAccount = async (e) => {
        e.preventDefault()
        try {
            if (email.toLowerCase().includes('@matchpoint.com')) {
                setErrorMessage(errorMessageContent['staff-email'])
            } else {
                if (username.toLowerCase() !== originalDetails.username) { // If username is changed
                    const checkUsername = await getDocs(query(collection(db, 'accounts'), where('username', '==', username.toLowerCase()))) // Check if username is already in use
                    if (checkUsername.empty === false) {
                        setErrorMessage(errorMessageContent['invalid-username'])
                        return
                    }
                }
                
                if (email.toLowerCase() !== originalDetails.email) { // If email is changed
                    const checkEmail = await getDocs(query(collection(db, 'accounts'), where('email', '==', email.toLowerCase()))) // Check if email is already in use
                    if (checkEmail.empty === false) {
                        setErrorMessage(errorMessageContent['invalid-email'])
                        return
                    }
                }
                
                saveChanges()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const saveChanges = async () => {
        try {
            const emailInfo = [location.state.id, email.toLowerCase()]
            await axios.post('http://localhost/updateEmail', { emailInfo })
            await updateDoc(doc(db, 'accounts', location.state.id), {
                username: username.toLowerCase(),
                fullName: fullName.trim().toLowerCase(),
                email: email.toLowerCase(),
                gender: gender.toLowerCase(),
                region: region,
                sportInterests: sports.slice().sort()
            })
            alert('Account updated successfully')
            window.location.href = '/ManageAccounts'
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignContent='center'>
                    <Typography variant='h3'>Edit Account</Typography>
                </Box>
                <form style={{width:'50%', marginTop:'50px'}} onSubmit={updateAccount}>
                    <Stack gap='25px'>
                        <TextField value={username} onChange={(e) => setUsername(e.target.value)}className='inputTextField' variant='outlined' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>
                        <TextField value={fullName} onChange={(e) => setFullName(e.target.value)} className='inputTextField' variant='outlined' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                        <TextField value={email} onChange={(e) => setEmail(e.target.value)} className='inputTextField' variant='outlined' label='Email' type='email' required/>
                        <Box display='flex' gap='50px'>
                            <FormControl className='dropdownList' fullWidth required>
                                <InputLabel>Gender</InputLabel>
                                <Select label='Gender' value={gender} onChange={(e) => setGender(e.target.value)} required>
                                    {genders.map((gender) => {
                                        return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                            <FormControl className='dropdownList' fullWidth required>
                                <InputLabel>Region</InputLabel>
                                <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region' required>
                                    {regions.map((region) => {
                                        return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                        </Box>

                        <FormControl className='dropdownList' fullWidth required>
                            <InputLabel>Sport(s)</InputLabel>
                            <Select label='Sport(s)' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                {sportsList?.map((sport) => {
                                    return <MenuItem value={sport.name} key={sport.name}>
                                        <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                        <Typography variant='action'>{sport.name}</Typography>
                                    </MenuItem>
                                })}
                            </Select>
                        </FormControl>
                        
                        
                        <Button onClick={() => resetPassword()} sx={{width:'180px', height:'30px'}} variant='red'>Reset Password</Button>
                        
                        <Stack marginTop='25px' gap='5px'>
                            <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>
                            <Box display='flex' justifyContent='space-between'>
                                <Button sx={{width:'300px'}} variant='blue' type='submit'>Save Changes</Button>
                                <Button sx={{width:'180px'}} variant='red' onClick={() => {window.location.href = '/ManageAccounts'}}>Back</Button>
                            </Box>
                        </Stack>
                    </Stack>
                </form>
            </Stack>
        </Box>
    )
}
