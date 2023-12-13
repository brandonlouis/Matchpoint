import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext'
import { getDoc, getDocs, updateDoc, collection, doc, where, query, orderBy, or } from 'firebase/firestore'

export default function ManageAccountProfile() {
    const { changeEmail, changePassword } = UserAuth()
    const { user, moreUserInfo } = UserAuth()

    const [accountProfileMode, setAccountProfileMode] = useState('account')
    const [editMode, setEditMode] = useState(false)
    
    const [originalDetails, setOriginalDetails] = useState({})
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [gender, setGender] = useState('')
    const [region, setRegion] = useState('')
    const [sports, setSports] = useState([])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [profileInfo, setProfileInfo] = useState({})
    const [teamInfo, setTeamInfo] = useState([])

    const [sportsList, setSportsList] = useState([])
    const genders = ["male", "female"]
    const regions = ["North", "Central", "East", "West", "North-East"]

    const errorMessageContent = {
        'invalid-username': "Username already in use",
        'invalid-email': 'Email already in use',
        'staff-email': 'Invalid Email address',
        'mismatched-passwords': "Passwords do not match",
        'weak-password': 'Password must be at least 6 characters long',
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
                const res = await getDoc(doc(db, 'accounts', user.uid))
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
        const getProfile = async () => {
            try {
                const res = await getDoc(doc(db, 'profiles', user.uid))
                const resList = res.data()
                setProfileInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getTeam = async () => {
            try {
                const q = query(collection(db, 'teams'), or(where('leader', '==', user.uid), where('members', 'array-contains', user.uid)))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data()}))
                setTeamInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
        getAccount()
        getProfile()
        getTeam()
    }, [])

    const concatSports = (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )
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

                if (newPassword !== '' || confirmPassword !== '') { // If password is changed
                    if (newPassword !== confirmPassword) {
                        setErrorMessage(errorMessageContent['mismatched-passwords'])
                        return
                    } else {
                        if (newPassword.length < 6) {
                            setErrorMessage(errorMessageContent['weak-password'])
                            return
                        }
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
            await changeEmail(email.toLowerCase())
            await updateDoc(doc(db, 'accounts', user.uid), {
                username: username.toLowerCase(),
                fullName: fullName.trim().toLowerCase(),
                email: email.toLowerCase(),
                gender: gender.toLowerCase(),
                region: region,
                sportInterests: sports.slice().sort()
            })
            alert('Account updated successfully')
            toggleEditMode(false)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleEditMode = (val) => {
        setErrorMessage('')
        setNewPassword('')
        setConfirmPassword('')
        setEditMode(val)
    }
    const toggleAccountProfileMode = (val) => {
        toggleEditMode(false)
        setAccountProfileMode(val)
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                <Box display='flex' gap='50px'>
                    <Stack gap='10px'>
                        <Button onClick={() => toggleAccountProfileMode('account')} sx={{opacity: accountProfileMode !== 'account' && '.3'}}><Typography variant='action'>Account</Typography></Button>
                        <Button onClick={() => toggleAccountProfileMode('profile')} sx={{opacity: accountProfileMode !== 'profile' && '.3'}}><Typography variant='action'>Profile</Typography></Button>
                    </Stack>
                    <Box borderLeft='1px solid #BBB' height='120px'></Box>
                </Box>
                {accountProfileMode === 'account' ?
                    <Stack width='50%'>
                        <Box display='flex' justifyContent='space-between' alignContent='center'>
                            <Typography variant='h3'>{editMode && 'Edit'} Account</Typography>
                        </Box>
                        <form style={{marginTop:'50px'}} onSubmit={updateAccount}>
                            <Stack gap='25px'>
                                <TextField value={username} onChange={(e) => setUsername(e.target.value)}className='inputTextField' variant='outlined' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required disabled={!editMode}/>
                                <TextField value={fullName} onChange={(e) => setFullName(e.target.value)} className='inputTextField' variant='outlined' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required disabled={!editMode}/>
                                <TextField value={email} onChange={(e) => setEmail(e.target.value)} className='inputTextField' variant='outlined' label='Email' type='email' required disabled={!editMode}/>
                                <Box display='flex' gap='50px'>
                                    <FormControl className='dropdownList' fullWidth required disabled={!editMode}>
                                        <InputLabel>Gender</InputLabel>
                                        <Select label='Gender' value={gender} onChange={(e) => setGender(e.target.value)} required disabled={!editMode}>
                                            {genders.map((gender) => {
                                                return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                    <FormControl className='dropdownList' fullWidth required disabled={!editMode}>
                                        <InputLabel>Region</InputLabel>
                                        <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region' required disabled={!editMode}>
                                            {regions.map((region) => {
                                                return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <FormControl className='dropdownList' fullWidth required disabled={!editMode}>
                                    <InputLabel>Sport(s)</InputLabel>
                                    <Select label='Sport(s)' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required disabled={!editMode}>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                                {editMode &&
                                    <>
                                        <TextField value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='inputTextField' variant='outlined' label='New Password' type='password'/>
                                        <TextField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='inputTextField' variant='outlined' label='Confirm Password' type='password'/>
                                    </>
                                }
                                


                                <Stack marginTop='25px' gap='5px'>
                                    <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>
                                    <Box display='flex' gap='20px' sx={{justifyContent: 'flex-start'}}>
                                        {editMode ?
                                            <>
                                                <Button sx={{width:'250px'}} variant='blue' type='submit'>Save Changes</Button>
                                                <Button sx={{width:'120px'}} variant='red' onClick={() => toggleEditMode(false)}>Back</Button>
                                            </>
                                            :
                                            <Button onClick={(e) => {e.preventDefault(); toggleEditMode(true)}} sx={{width:'250px'}} variant='blue'>Edit Account</Button>
                                        }
                                    </Box>
                                </Stack>
                            </Stack>
                        </form>
                    </Stack>
                    :
                    <Stack width='100%' gap='50px'>
                        <Box display='flex' justifyContent='space-between' alignContent='center'>
                            <Typography variant='h3'>Profile</Typography>
                        </Box>
                        <Box display='flex' gap='50px'>
                            <Stack alignItems='center' justifyContent='center' gap='15px' padding='30px'>
                                <Stack gap='5px'>
                                    <Typography variant='h5'>@{moreUserInfo?.username}</Typography>
                                    <Typography textTransform='capitalize' textAlign='center' variant='subtitle4'>{moreUserInfo?.fullName}</Typography>
                                </Stack>
                                <Typography color='#888' variant='subtitle2'>{moreUserInfo?.region}</Typography>
                            </Stack>

                            <Stack gap='50px' width='100%'>
                                <Stack gap='25px'>
                                    <Stack gap='10px'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5'>Team</Typography>
                                        <hr width='100%'/>
                                    </Stack>
                                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                                        {teamInfo[0] ?
                                            <>
                                                <Typography variant='body1'>@{teamInfo[0].handle}</Typography>
                                                <Button sx={{height:'30px'}} variant='blue'>View Team</Button>
                                            </>
                                            : 
                                            <>
                                                <Typography variant='body1'>Not in a team</Typography>
                                                <Box display='flex' gap='10px'>
                                                    <Button sx={{height:'30px'}} variant='blue'>Join a Team</Button>
                                                    <Button sx={{height:'30px'}} variant='blue' onClick={() => window.location.href = `/CreateTeam`}>Create a Team</Button>
                                                </Box>
                                            </>
                                        }
                                    </Box>
                                </Stack>

                                <Stack gap='25px'>
                                    <Stack gap='10px'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5'>Statistics</Typography>
                                        <hr width='100%'/>
                                    </Stack>
                                    <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                            <Box display='flex' gap='25px'>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/first.png')}/>
                                                    <Typography variant='body1'>{profileInfo?.first}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/second.png')}/>
                                                    <Typography variant='body1'>{profileInfo?.second}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/third.png')}/>
                                                    <Typography variant='body1'>{profileInfo?.third}</Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Tournaments Played</Typography>
                                            <Box display='flex'>
                                                <Typography variant='body1'>{profileInfo?.tournamentsParticipated}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>
                }
            </Box>
        </Box>
    )
}