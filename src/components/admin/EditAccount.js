import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { db } from '../../config/firebase';
import { getDoc, doc, getDocs, collection, updateDoc, query, where } from 'firebase/firestore';

export default function EditAccount() {
    const location = useLocation()

    const [originalDetails, setOriginalDetails] = useState({})
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [countryCode, setCountryCode] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [country, setCountry] = useState('')
    const [type, setType] = useState('')

    const countries = ["afghanistan","albania","algeria","andorra","angola","antigua and barbuda","argentina","armenia","australia","austria","azerbaijan","bahamas","bahrain","bangladesh","barbados","belarus","belgium","belize","benin","bhutan","bolivia","bosnia and herzegovina","botswana","brazil","brunei","bulgaria","burkina faso","burundi","cabo verde","cambodia","cameroon","canada","central african republic","chad","chile","china","colombia","comoros","costa rica","cote d'Ivoire","croatia","cuba","cyprus","czechia","democratic republic of the congo","denmark","djibouti","dominica","dominican republic","ecuador","egypt","el salvador","equatorial guinea","eritrea","estonia","eswatini","ethiopia","fiji","finland","france","gabon","gambia","georgia","germany","ghana","greece","grenada","guatemala","guinea-bissau","guinea","guyana","haiti","honduras","hong kong","hungary","iceland","india","indonesia","iran","iraq","ireland","israel","italy","jamaica","japan","jordan","kazakhstan","kenya","kiribati","kosovo","kuwait","kyrgyzstan","laos","latvia","lebanon","lesotho","liberia","libya","liechtenstein","lithuania","luxembourg","madagascar","malawi","malaysia","maldives","mali","malta","marshall islands","mauritania","mauritius","mexico","micronesia","moldova","monaco","mongolia","montenegro","morocco","mozambique","myanmar","namibia","nauru","nepal","netherlands","new zealand","nicaragua","niger","nigeria","north korea","north macedonia","norway","oman","pakistan","palau","palestine","panama","papua new guinea","paraguay","peru","philippines","poland","portugal","qatar","republic of the congo","romania","russia","rwanda","saint kitts and nevis","saint lucia","saint vincent and the grenadines","samoa","san marino","sao tome and principe","saudi arabia","senegal","serbia","seychelles","sierra leone","singapore","slovakia","slovenia","solomon islands","somalia","south africa","south korea","south sudan","spain","sri lanka","sudan","suriname","sweden","switzerland","syria","taiwan","tajikistan","tanzania","thailand","timor-leste","togo","tonga","trinidad and tobago","tunisia","turkey","turkmenistan","tuvalu","uae","uganda","ukraine","united kingdom","uruguay","usa","uzbekistan","vanuatu","vatican city","venezuela","vietnam","yemen","zambia","zimbabwe"]

    const errorMessageContent = {
        'invalid-username': "Username already in use",
        'invalid-email': 'Email already in use',
        'staff-email': 'Invalid Email address',
        'mismatched-passwords': "Passwords do not match",
        'weak-password': 'Password must be at least 6 characters long',
    }
    const [errorMessage, setErrorMessage] = useState('')

    // TODO: Reflect email changes in firebase Auth side, create reset password function using auth module

    useEffect(() => {
        const getAccount = async () => {
            try {
                const res = await getDoc(doc(db, 'accounts', location.state.id))
                const resList = res.data()
                setOriginalDetails(resList)

                setUsername(resList.username)
                setFullName(resList.fullName)
                setEmail(resList.email)
                setCountryCode(resList.countryCode)
                setPhoneNumber(resList.phoneNumber)
                setCountry(resList.country)
                setType(resList.type)
            } catch (err) {
                console.error(err)
            }
        }
        getAccount()
    }, [])

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
                    } else {
                        saveChanges()
                    }
                } else if (email.toLowerCase() !== originalDetails.email) { // If email is changed
                    const checkEmail = await getDocs(query(collection(db, 'accounts'), where('email', '==', email.toLowerCase()))) // Check if email is already in use
                    if (checkEmail.empty === false) {
                        setErrorMessage(errorMessageContent['invalid-email'])
                    } else {
                        saveChanges()
                    }
                } else {
                    saveChanges()
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    const saveChanges = async () => {
        if (type === 'user') {
            await updateDoc(doc(db, 'accounts', location.state.id), {
                username: username.toLowerCase(),
                fullName: fullName.trim().toLowerCase(),
                email: email.toLowerCase(),
                countryCode: countryCode.trim(),
                phoneNumber: phoneNumber.trim(),
                country: country,
            })
        } else if (type === 'event coordinator') {
            await updateDoc(doc(db, 'accounts', location.state.id), {
                fullName: fullName.trim().toLowerCase(),
                email: email.toLowerCase(),
                countryCode: countryCode.trim(),
                phoneNumber: phoneNumber.trim(),
            })
        }
        window.location.href = '/ManageAccounts'
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignContent='center'>
                    <Typography variant='h3'>Edit Account</Typography>
                </Box>
                <form style={{width:'50%', marginTop:'50px'}} onSubmit={updateAccount}>
                    <Stack gap='25px'>
                        <TextField value={fullName} onChange={(e) => setFullName(e.target.value)} className='inputTextField' variant='outlined' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                        {type === 'user' && 
                            <TextField value={username} onChange={(e) => setUsername(e.target.value)}className='inputTextField' variant='outlined' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>
                        }
                        <TextField value={email} onChange={(e) => setEmail(e.target.value)} className='inputTextField' variant='outlined' label='Email' type='email' required/>
                        <Box display='flex' justifyContent='space-between'>
                            <TextField value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className='inputTextField' sx={{width:'25%'}} variant='outlined' label='Country Code' inputProps={{pattern:'^[0-9]{1,3}$'}} required/>
                            <TextField value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='inputTextField' sx={{width:'70%'}} variant='outlined' label='Phone Number' inputProps={{pattern:'^[0-9]*$'}} required/>
                        </Box>
                        {type === 'user' && 
                            <FormControl className='dropdownList' fullWidth required>
                                <InputLabel>Country</InputLabel>
                                <Select value={country} onChange={(e) => setCountry(e.target.value)} label='Country' required>
                                    {countries.map((country) => {
                                        return <MenuItem value={country} key={country}><Typography textTransform='capitalize' variant='action'>{country}</Typography></MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                        }
                        
                        <Button sx={{width:'180px', height:'30px'}} variant='red' type='submit'>Reset Password</Button>
                        
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
