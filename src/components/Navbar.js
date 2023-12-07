import React, { useState } from 'react'
import { Box, Button, Stack, Typography, Modal, TextField, Menu, MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import loginSignUpBG from '../img/backgrounds/loginSignUpBG.png'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { db } from '../config/firebase'
import { UserAuth } from '../config/authContext'
import { collection, doc, setDoc, where, query, getDocs } from 'firebase/firestore'

export default function Navbar() {
    const { createUser } = UserAuth()
    const { user, moreUserInfo, login, logout } = UserAuth()

    const [userType, setUserType] = useState('user') // ['user', 'eventCoord']
    const [loginSignUp, setLoginSignUp] = useState('login') // ['login', 'signUp']
    const [openModal, setOpenModal] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)
    const openAccDropdown = Boolean(anchorEl)

    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [regFullName, setRegFullName] = useState('')
    const [regUsername, setRegUsername] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regCountryCode, setRegCountryCode] = useState('')
    const [regPhoneNumber, setRegPhoneNumber] = useState('')
    const [regCountry, setRegCountry] = useState('')
    const [regPassword, setRegPassword] = useState('')
    const [regConfirmPassword, setRegConfirmPassword] = useState('')

    const countries = ["afghanistan","albania","algeria","andorra","angola","antigua and barbuda","argentina","armenia","australia","austria","azerbaijan","bahamas","bahrain","bangladesh","barbados","belarus","belgium","belize","benin","bhutan","bolivia","bosnia and herzegovina","botswana","brazil","brunei","bulgaria","burkina faso","burundi","cabo verde","cambodia","cameroon","canada","central african republic","chad","chile","china","colombia","comoros","costa rica","cote d'Ivoire","croatia","cuba","cyprus","czechia","democratic republic of the congo","denmark","djibouti","dominica","dominican republic","ecuador","egypt","el salvador","equatorial guinea","eritrea","estonia","eswatini","ethiopia","fiji","finland","france","gabon","gambia","georgia","germany","ghana","greece","grenada","guatemala","guinea-bissau","guinea","guyana","haiti","honduras","hong kong","hungary","iceland","india","indonesia","iran","iraq","ireland","israel","italy","jamaica","japan","jordan","kazakhstan","kenya","kiribati","kosovo","kuwait","kyrgyzstan","laos","latvia","lebanon","lesotho","liberia","libya","liechtenstein","lithuania","luxembourg","madagascar","malawi","malaysia","maldives","mali","malta","marshall islands","mauritania","mauritius","mexico","micronesia","moldova","monaco","mongolia","montenegro","morocco","mozambique","myanmar","namibia","nauru","nepal","netherlands","new zealand","nicaragua","niger","nigeria","north korea","north macedonia","norway","oman","pakistan","palau","palestine","panama","papua new guinea","paraguay","peru","philippines","poland","portugal","qatar","republic of the congo","romania","russia","rwanda","saint kitts and nevis","saint lucia","saint vincent and the grenadines","samoa","san marino","sao tome and principe","saudi arabia","senegal","serbia","seychelles","sierra leone","singapore","slovakia","slovenia","solomon islands","somalia","south africa","south korea","south sudan","spain","sri lanka","sudan","suriname","sweden","switzerland","syria","taiwan","tajikistan","tanzania","thailand","timor-leste","togo","tonga","trinidad and tobago","tunisia","turkey","turkmenistan","tuvalu","uae","uganda","ukraine","united kingdom","uruguay","usa","uzbekistan","vanuatu","vatican city","venezuela","vietnam","yemen","zambia","zimbabwe"]

    const errorMessageContent = {
        // Firebase auth error codes
        'auth/email-already-in-use': "Email already in use",
        'auth/invalid-email': "Invalid Email address",
        'auth/weak-password': "Password must be at least 6 characters long",
        'auth/invalid-credential': "Incorrect Email or Password",
        'auth/too-many-requests': "Too many invalid attempts, please try again later",

        // Outside of firebase error codes
        'invalid-username': "Username already in use",
        'staff-email': 'Invalid Email address',
        'mismatched-passwords': "Passwords do not match",
    }
    const [errorMessage, setErrorMessage] = useState('')


    const changeLoginSignUp = (type) => { // Handle clearing of error messages when changing between login and sign up
        setLoginSignUp(type)
        setErrorMessage('')
    }
    const changeUserType = (type) => { // Handle clearing of error messages and old input when changing between user and event coordinator
        setUserType(type)
        setRegCountry('')
        setRegUsername('')
        setErrorMessage('')
    }

    const createAccount = async (e) => { // Account creation
        e.preventDefault()
        try {
            const checkUsername = await getDocs(query(collection(db, 'accounts'), where('username', '==', regUsername.toLowerCase()))) // Check if username is already in use

            if (regEmail.toLowerCase().includes('@matchpoint.com')) {
                setErrorMessage(errorMessageContent['staff-email'])
            } else if (regPassword != regConfirmPassword) {
                setErrorMessage(errorMessageContent['mismatched-passwords'])
            } else if (checkUsername.empty === false) {
                setErrorMessage(errorMessageContent['invalid-username'])
            } else if (regPassword.length < 6 || regConfirmPassword.length < 6) {
                setErrorMessage(errorMessageContent['auth/weak-password'])
            } else {
                if (userType === 'user') {
                    await createUser(regEmail.toLowerCase(), regPassword).then((userCredential) => {
                        setDoc(doc(db, "accounts", userCredential.user.uid), {
                            fullName: regFullName.trim().toLowerCase(),
                            username: regUsername.toLowerCase(),
                            email: regEmail.toLowerCase(),
                            countryCode: regCountryCode.trim(),
                            phoneNumber: regPhoneNumber.trim(),
                            country: regCountry,
                            type: 'user',
                        })
                        alert('Account created successfully')
                        setOpenModal(false) // Close modal after account creation

                    })
                } else if (userType === 'eventCoord') { // Create event coordinator application
                    const checkApplicationEmail = await getDocs(query(collection(db, 'eventCoordApplications'), where('email', '==', regEmail.toLowerCase())))
                    const checkAccountsEmail = await getDocs(query(collection(db, 'accounts'), where('email', '==', regEmail.toLowerCase())))

                    if (checkApplicationEmail.empty === false || checkAccountsEmail.empty === false) { // Check if email is already in use in both auth and application list
                        setErrorMessage(errorMessageContent['auth/email-already-in-use'])
                    } else {
                        let checkApplicationID
                        let randomNumber
                        do {
                            randomNumber = Math.floor(Math.random() * 99999) + 1
                            randomNumber = randomNumber.toString().padStart(5,'0') // Add trailing '0' and convert to string

                            const querySnapshot = await getDocs(query(collection(db, 'eventCoordApplications'), where('id', '==', randomNumber)))
                            checkApplicationID = querySnapshot.docs.length > 0; // Check if there is a matching record
                        } while (checkApplicationID)

                        await setDoc(doc(db, "eventCoordApplications", randomNumber), {
                            id: randomNumber.toString(),
                            fullName: regFullName.trim().toLowerCase(),
                            email: regEmail.toLowerCase(),
                            countryCode: regCountryCode.trim(),
                            phoneNumber: regPhoneNumber.trim(),
                            password: regPassword,
                            type: 'event coordinator',
                        })
                        alert('Account application submitted successfully. Approval may take up to 3 working days.')
                        setOpenModal(false) // Close modal after account creation
                    }
                }
            }
        } catch (err) {
            setErrorMessage(errorMessageContent[err.code])
        }
    }

    const handleLogin = async (e) => { // User login
        e.preventDefault()
        try {
            await login(loginEmail, loginPassword)
            window.location.reload()
        } catch (err) {
            setErrorMessage(errorMessageContent[err.code])
        }
    }

    const handleLogout = async () => { // User logout
        try {
            await logout()
            window.location.href = '/'
        } catch (err) {
            console.error(err)
        }
    }
    // TODO: When signing in via Event Coord, check Event Coord application list for email and password, if exists, prompt "Your application is still pending approval. Please try again later.". If not, prompt "Incorrect Email or Password"


    return (
        <>
        <Box width='100%' display='flex' justifyContent='center' position='absolute'>
            <Box width='80%' display='flex' justifyContent='space-between'>
                <Box display='flex' alignItems='center' justifyContent='space-between' padding='45px 0' gap='30px'>
                    <a href='/'><img height='30px' src={require('../img/logo/logoBlack.png')}/></a>
                    <a href='/' style={{marginLeft:'10px'}}><Typography variant='action'>Home</Typography></a>
                    <a href='/Tournaments'><Typography variant='action'>Tournaments</Typography></a>
                    <a href='/NewsArticles'><Typography variant='action'>News Articles</Typography></a>
                    <a href='#'><Typography variant='action'>Players & Teams</Typography></a>
                </Box>
                {!user ?
                    <Box display='flex' alignItems='center' margin='28px 0' padding='10px' bgcolor='white' borderRadius='15px' boxShadow='0 5px 10px rgba(0, 0, 0, 0.3)'>
                        <Button onClick={() => {setOpenModal(true); changeLoginSignUp('login'); changeUserType('user')}} style={{padding:'10px 15px'}}><Typography variant='action'>Login</Typography></Button>
                        <Button onClick={() => {setOpenModal(true); changeLoginSignUp('signUp'); changeUserType('user')}} variant='red'>Sign Up</Button>
                    </Box>
                    :
                    <Box display='flex' alignItems='center'>
                        <Button style={{margin:'50px 0', padding:'0', display:'flex', gap:'15px', borderRadius:'25px'}} onClick={(e) => {setAnchorEl(e.currentTarget)}}><img height='50px' style={{borderRadius:'100%'}} src={localStorage['fullName'] !== 'undefined' ? require('../img/account/users.png') : require('../img/account/admin.png')}/><Typography variant='action' display='flex' >{localStorage['fullName'] !== 'undefined' ? localStorage['fullName'] : 'Admin'}<ArrowDropDownIcon sx={{fontSize:'25px', color:'black'}} /></Typography></Button>


                        { moreUserInfo?.type === 'admin' &&
                            <Menu anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openAccDropdown} onClose={() => {setAnchorEl(null)}} disableScrollLock>
                                <MenuItem onClick={() => {window.location.href = '/ManageAccounts'}}><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Manage Accounts</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/ManageTournaments'}}><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>Manage Tournaments</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/ManageNewsArticles'}}><img width='18px' src={require('../img/icons/news.png')}/><Typography variant='navDropdown'>Manage News Articles</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/ManageSports'}}><img width='18px' src={require('../img/icons/sports.png')}/><Typography variant='navDropdown'>Manage Sports</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/ManageApplications'}}><img width='18px' src={require('../img/icons/eventCoordApplication.png')}/><Typography variant='navDropdown'>Manage Applications</Typography></MenuItem>
                                <hr style={{width:'170px', opacity:'.3'}}/>
                                <MenuItem onClick={() => {setAnchorEl(null); handleLogout()}}><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></MenuItem>
                            </Menu>
                        }

                        { moreUserInfo?.type === 'user' &&
                            <Menu anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openAccDropdown} onClose={() => {setAnchorEl(null)}}>
                                <MenuItem onClick={() => {window.location.href = '/Tournaments'}}><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Profile</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/Tournaments'}}><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>My Tournaments</Typography></MenuItem>
                                <hr style={{width:'170px', opacity:'.3'}}/>
                                <MenuItem onClick={() => {setAnchorEl(null); handleLogout()}}><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></MenuItem>
                            </Menu>
                        }

                        { moreUserInfo?.type === 'eventCoord' &&
                            <Menu anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openAccDropdown} onClose={() => {setAnchorEl(null)}}>
                                <MenuItem onClick={() => {window.location.href = '/Tournaments'}}><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Account</Typography></MenuItem>
                                <MenuItem onClick={() => {window.location.href = '/NewsArticles'}}><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>My News Articles</Typography></MenuItem>
                                <hr style={{width:'170px', opacity:'.3'}}/>
                                <MenuItem onClick={() => {setAnchorEl(null); handleLogout()}}><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></MenuItem>
                            </Menu>
                        }
                    </Box>
                }
            </Box>
        </Box>

        <Modal open={openModal} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalLoginSignUp' display='flex' borderRadius='15px' width='700px' height='700px' margin='120px auto'>
                <Stack width='50%' justifyContent='center' alignItems='center' gap='100px' borderRadius='15px 0 0 15px' sx={{backgroundImage: `url('${loginSignUpBG}')`, backgroundRepeat:"no-repeat", backgroundSize:'cover'}}>
                    <Stack alignItems='center' gap='5px' style={{ opacity: userType === 'user' ? '100%' : '50%' }}>
                        <Button sx={{padding:'0'}} onClick={() => changeUserType('user')}><img height='100px' src={require('../img/buttons/userBtn.png')}/></Button>
                        <Typography color='white' variant='action'>User</Typography>
                    </Stack>
                    <Stack alignItems='center' gap='5px' style={{ opacity: userType === 'eventCoord' ? '100%' : '50%' }}>
                        <Button sx={{padding:'0'}} onClick={() => changeUserType('eventCoord')}><img height='100px' src={require('../img/buttons/eventCoordBtn.png')}/></Button>
                        <Typography color='white' variant='action'>Event Coordinator</Typography>
                    </Stack>
                </Stack>

                {loginSignUp === 'login' ?
                    <Stack width='50%' justifyContent='center' bgcolor='white' borderRadius='0 15px 15px 0' padding='0 35px'>
                        <Stack width='100%' height='95%' gap='50px' alignItems='center' justifyContent='center'>
                            <Typography variant='h3Caps'>Welcome Back!</Typography>
                            <form style={{width:'100%'}} onSubmit={handleLogin}>
                                <Stack gap='10px' marginBottom='50px'>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setLoginEmail(e.target.value)} fullWidth variant='standard' label='Email' type='email' required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setLoginPassword(e.target.value)} fullWidth variant='standard' label='Password' type='password' required/>
                                </Stack>
                                <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='loginErrorMsg'>{errorMessage}</Typography></Box>
                                <Button fullWidth variant='red' type='submit'>Login</Button>
                            </form>
                        </Stack>
                        <Box display='flex' alignItems='center' justifyContent='center' height='5%'>
                            <Typography variant='loginSignUp'>Don't have an account? <a href='#' onClick={() => changeLoginSignUp('signUp')}><Typography sx={{textDecoration:'underline', color:'#006DEE'}} variant='loginSignUp'>Sign Up</Typography></a></Typography>
                        </Box>
                    </Stack>

                    :

                    <Stack width='50%' justifyContent='center' bgcolor='white' borderRadius='0 15px 15px 0' padding='0 35px'>
                        <Stack width='100%' height='95%' gap='50px' alignItems='center' justifyContent='center'>
                            <Typography variant='h3Caps'>Let's Get Started!</Typography>
                            <form style={{width:'100%'}} onSubmit={createAccount}>
                                <Stack gap='10px' marginBottom='50px'>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegFullName(e.target.value)} fullWidth variant='standard' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                                    {userType === 'user' && <TextField className='loginSignUpTextField' onChange={(e) => setRegUsername(e.target.value)} fullWidth variant='standard' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>}
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegEmail(e.target.value)} fullWidth variant='standard' label='Email' type='email' required/>
                                    <Box display='flex' gap='30px'>
                                        <TextField className='loginSignUpTextField' onChange={(e) => setRegCountryCode(e.target.value)} variant='standard' label='Country Code' inputProps={{pattern:'^[0-9]{1,3}$'}} required/>
                                        <TextField className='loginSignUpTextField' onChange={(e) => setRegPhoneNumber(e.target.value)} fullWidth variant='standard' label='Phone Number' inputProps={{pattern:'^[0-9]*$'}} required/>
                                    </Box>

                                    {userType === 'user' && 
                                    <FormControl variant='standard' className='dropdownList' fullWidth required>
                                        <InputLabel>Country</InputLabel>
                                        <Select label='Country' value={regCountry} onChange={(e) => setRegCountry(e.target.value)} required>
                                            {countries.map((country) => {
                                                return <MenuItem value={country} key={country}><Typography textTransform='capitalize' variant='action'>{country}</Typography></MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>}

                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegPassword(e.target.value)} fullWidth variant='standard' label='Password' type='password' required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegConfirmPassword(e.target.value)} fullWidth variant='standard' label='Confirm password' type='password' required/>
                                </Stack>
                                <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='loginErrorMsg'>{errorMessage}</Typography></Box>
                                <Button fullWidth variant='red' type='submit'>Sign Up</Button>
                            </form>
                        </Stack>
                        <Box display='flex' alignItems='center' justifyContent='center' height='5%'>
                            <Typography variant='loginSignUp'>Already have an account? <a href='#' onClick={() => changeLoginSignUp('login')}><Typography sx={{textDecoration:'underline', color:'#006DEE'}} variant='loginSignUp'>Login</Typography></a></Typography>
                        </Box>
                    </Stack>
                }
            </Box>
        </Modal>
        </>
    )
}
