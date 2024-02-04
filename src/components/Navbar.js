import React, { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography, Modal, TextField, Menu, MenuItem, FormControl, InputLabel, Select, Checkbox } from '@mui/material'
import loginSignUpBG from '../img/backgrounds/loginSignUpBG.png'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { db } from '../config/firebase'
import { UserAuth } from '../config/authContext'
import { getDocs, collection, doc, setDoc, where, query, orderBy} from 'firebase/firestore'
import { useMediaQuery } from 'react-responsive'

export default function Navbar() {
    const adjust1115 = useMediaQuery({ query: '(max-width: 1115px)' })
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust900 = useMediaQuery({ query: '(max-width: 900px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const [openResponsiveNav, setOpenResponsiveNav] = React.useState(false)

    const { createUser, user, moreUserInfo, login, logout, emailVerification } = UserAuth()

    const [loginSignUp, setLoginSignUp] = useState('login') // ['login', 'signUp']
    const [openModal, setOpenModal] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)
    const openAccDropdown = Boolean(anchorEl)

    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [regUsername, setRegUsername] = useState('')
    const [regFullName, setRegFullName] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regGender, setRegGender] = useState('')
    const [regRegion, setRegRegion] = useState('')
    const [regSports, setRegSports] = useState([])
    const [regPassword, setRegPassword] = useState('')
    const [regConfirmPassword, setRegConfirmPassword] = useState('')

    const [sportsList, setSportsList] = useState([])
    const genders = ["male", "female"]
    const regions = ["North", "Central", "East", "West", "North-East"]

    const errorMessageContent = {
        // Firebase auth error codes
        'auth/email-already-in-use': "Email already in use",
        'auth/invalid-email': "Invalid Email address",
        'auth/weak-password': "Password must be at least 6 characters long",
        'auth/invalid-credential': "Incorrect Email or Password",
        'auth/wrong-password': "Incorrect Email or Password",
        'auth/user-not-found': "Incorrect Email or Password",
        'auth/too-many-requests': "Too many invalid attempts, please try again later",

        // Outside of firebase error codes
        'invalid-username': "Username already in use",
        'staff-email': 'Invalid Email address',
        'mismatched-passwords': "Passwords do not match",
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
        getSports()
    }, [])

    const concatSports = (e) => {
        const {target: {value}} = e;
        setRegSports(
            typeof value === 'string' ? value.split(',') : value,
        )
    }

    const changeLoginSignUp = (type) => { // Handle clearing of error messages when changing between login and sign up
        setLoginSignUp(type)
        setErrorMessage('')
        setRegGender('')
        setRegRegion('')
        setRegSports([])
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
                await createUser(regEmail.toLowerCase(), regPassword).then((userCredential) => {
                    setDoc(doc(db, "accounts", userCredential.user.uid), {
                        username: regUsername.toLowerCase(),
                        fullName: regFullName.trim().toLowerCase(),
                        email: regEmail.toLowerCase(),
                        gender: regGender.toLowerCase(),
                        region: regRegion,
                        sportInterests: regSports.slice().sort()
                    })
                    setDoc(doc(db, "profiles", userCredential.user.uid), {
                        first: 0,
                        second: 0,
                        third: 0,
                        tournamentsParticipated: 0
                    })

                    emailVerification(userCredential.user)
                    alert('Account created successfully.\n\nConfirmation email has been sent. Verify your account to access all features.')
                    setOpenModal(false) // Close modal after account creation
                })
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


    return (
        <>
        {isTablet || isMobile ? (
            <>
            <Box width='100%' display='flex' justifyContent='center' position='absolute'>
                <Box width='90%' display='flex' justifyContent='space-between' alignItems='center' padding='30px 0'>
                    <a href='/'><img height='30px' src={require('../img/logo/logoBlack.png')}/></a>
                    <Button sx={{padding:'0', height:'fit-content', display:'flex', justifyContent:'flex-end'}} onClick={() => setOpenResponsiveNav(true)}><MenuIcon sx={{fontSize:'40px', color:'#222'}} /></Button>
                </Box>
            </Box>

            <Modal open={openResponsiveNav} onClose={() => setOpenResponsiveNav(false)}  sx={{display:'flex', justifyContent:'flex-end'}}>
                <Stack className='responsiveNavMenu' height='100vh' width={isMobile ? '65%' : isTablet ? '40%' : undefined} bgcolor='#EEE'>
                    <Box display='flex' justifyContent='flex-end' padding={isMobile ? '30px 15px 0 0' : '30px 40px'}>
                        <a onClick={() => setOpenResponsiveNav(false)}><CloseIcon sx={{color:'#222', fontSize:'40px'}}/></a>
                    </Box>
                    <Stack alignItems='center'>
                        <a href='/' className='responsiveNavLinks'><Typography variant='action'>Home</Typography></a>
                        <a href='/Tournaments' className='responsiveNavLinks'><Typography variant='action'>Tournaments</Typography></a>
                        <a href='/NewsArticles' className='responsiveNavLinks'><Typography variant='action'>News Articles</Typography></a>
                        <a href='/PlayersTeams' className='responsiveNavLinks'><Typography variant='action'>Players & Teams</Typography></a>
                        <hr style={{width:'90%', margin:'20px 0'}}/>
                        {!user ?
                            <Box display='flex' alignItems='center' margin='15px 0' padding='10px' bgcolor='white' borderRadius='15px' boxShadow='0 5px 10px rgba(0, 0, 0, 0.3)'>
                                <Button onClick={() => {setOpenModal(true); changeLoginSignUp('login');}} style={{padding:'10px 15px'}}><Typography variant='action'>Login</Typography></Button>
                                <Button onClick={() => {setOpenModal(true); changeLoginSignUp('signUp');}} variant='red'>Sign Up</Button>
                            </Box>
                            :
                            <>
                            <Box padding='20px 0' display='flex' alignItems='center'>
                                <img height='50px' style={{borderRadius:'100%'}} src={localStorage['fullName'] !== 'undefined' ? require('../img/account/users.png') : require('../img/account/admin.png')}/>
                                <Box display='flex'>
                                    <Typography variant='navDropdown' maxWidth='150px' overflow='hidden' whiteSpace='nowrap' textOverflow='ellipsis'>
                                        {localStorage['fullName'] !== 'undefined' ? localStorage['fullName'] : 'Admin'}
                                    </Typography>
                                </Box>
                            </Box>
                            {moreUserInfo?.type === 'admin' ?
                                <>
                                <a href='/ManageAccounts' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Manage Accounts</Typography></a>
                                <a href='/ManageTournaments' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>Manage Tournaments</Typography></a>
                                <a href='/ManageNewsArticles' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/news.png')}/><Typography variant='navDropdown'>Manage News Articles</Typography></a>
                                <a href='/ManageSports' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/sports.png')}/><Typography variant='navDropdown'>Manage Sports</Typography></a>
                                </>
                                :
                                <>
                                <a href='/ManageAccountProfile' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Account & Profile</Typography></a>
                                <a href='/MyTournaments' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>My Tournaments</Typography></a>
                                <a href='/MyNewsArticles' className='responsiveNavLinks'><img width='18px' src={require('../img/icons/news.png')}/><Typography variant='navDropdown'>My News Articles</Typography></a>
                                </>
                            }
                            <a onClick={() => handleLogout()} className='responsiveNavLinks'><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></a>
                            </>
                        }
                    </Stack>
                </Stack>
            </Modal>
            </>
        ) : (
            <Box width='100%' display='flex' justifyContent='center' position='absolute'>
                <Box width='80%' display='flex' justifyContent='space-between'>
                    <Box display='flex' alignItems='center' justifyContent='space-between' padding='45px 0' gap='30px'>
                        <a href='/'><img height='30px' src={require('../img/logo/logoBlack.png')}/></a>
                        {!adjust1115 && 
                            <a href='/' style={{marginLeft:'10px'}}><Typography variant='action'>Home</Typography></a>
                        }
                        <a href='/Tournaments'><Typography variant='action'>Tournaments</Typography></a>
                        <a href='/NewsArticles'><Typography variant='action'>News Articles</Typography></a>
                        <a href='/PlayersTeams'><Typography variant='action'>Players & Teams</Typography></a>
                    </Box>
                    {!user ?
                        <Box display='flex' alignItems='center' margin='28px 0' padding='10px' bgcolor='white' borderRadius='15px' boxShadow='0 5px 10px rgba(0, 0, 0, 0.3)'>
                            <Button onClick={() => {setOpenModal(true); changeLoginSignUp('login');}} style={{padding:'10px 15px'}}><Typography variant='action'>Login</Typography></Button>
                            <Button onClick={() => {setOpenModal(true); changeLoginSignUp('signUp');}} variant='red'>Sign Up</Button>
                        </Box>
                        :
                        <Box display='flex' alignItems='center'>
                            <Button style={{margin:'28px 0', padding:'0', display:'flex', gap:'15px', borderRadius:'25px'}} onClick={(e) => {setAnchorEl(e.currentTarget)}}>
                                <img height='50px' style={{borderRadius:'100%'}} src={localStorage['fullName'] !== 'undefined' ? require('../img/account/users.png') : require('../img/account/admin.png')}/>
                                <Box display='flex'>
                                    <Typography variant='action' maxWidth='150px' overflow='hidden' whiteSpace='nowrap' textOverflow='ellipsis'>
                                        {localStorage['fullName'] !== 'undefined' ? localStorage['fullName'] : 'Admin'}
                                    </Typography>
                                    <ArrowDropDownIcon sx={{fontSize:'25px', color:'black'}} />
                                </Box>
                            </Button>


                            { moreUserInfo?.type === 'admin' ?
                                <Menu anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openAccDropdown} onClose={() => {setAnchorEl(null)}} disableScrollLock>
                                    <MenuItem onClick={() => {window.location.href = '/ManageAccounts'}}><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Manage Accounts</Typography></MenuItem>
                                    <MenuItem onClick={() => {window.location.href = '/ManageTournaments'}}><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>Manage Tournaments</Typography></MenuItem>
                                    <MenuItem onClick={() => {window.location.href = '/ManageNewsArticles'}}><img width='18px' src={require('../img/icons/news.png')}/><Typography variant='navDropdown'>Manage News Articles</Typography></MenuItem>
                                    <MenuItem onClick={() => {window.location.href = '/ManageSports'}}><img width='18px' src={require('../img/icons/sports.png')}/><Typography variant='navDropdown'>Manage Sports</Typography></MenuItem>
                                    <hr style={{width:'170px', opacity:'.3'}}/>
                                    <MenuItem onClick={() => {setAnchorEl(null); handleLogout()}}><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></MenuItem>
                                </Menu>
                                :
                                <Menu anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openAccDropdown} onClose={() => {setAnchorEl(null)}} disableScrollLock>
                                    <MenuItem onClick={() => {window.location.href = '/ManageAccountProfile'}}><img width='18px' src={require('../img/icons/account.png')}/><Typography variant='navDropdown'>Account & Profile</Typography></MenuItem>
                                    <MenuItem onClick={() => {window.location.href = '/MyTournaments'}}><img width='18px' src={require('../img/icons/tournament.png')}/><Typography variant='navDropdown'>My Tournaments</Typography></MenuItem>
                                    <MenuItem onClick={() => {window.location.href = '/MyNewsArticles'}}><img width='18px' src={require('../img/icons/news.png')}/><Typography variant='navDropdown'>My News Articles</Typography></MenuItem>
                                    <hr style={{width:'170px', opacity:'.3'}}/>
                                    <MenuItem onClick={() => {setAnchorEl(null); handleLogout()}}><img width='18px' src={require('../img/icons/logout.png')}/><Typography variant='navDropdown'>Logout</Typography></MenuItem>
                                </Menu>
                            }
                        </Box>
                    }
                </Box>
            </Box>
        )}

        <Modal open={openModal} sx={{display:'flex', alignItems:'center', justifyContent:'center'}} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalLoginSignUp' display='flex' borderRadius='15px' width='80%' maxWidth='700px' height={isMobile ? '620px' : '700px'}>
                {!isMobile &&
                    <Stack width='50%' justifyContent='center' alignItems='center' gap='100px' borderRadius='15px 0 0 15px' sx={{backgroundImage: `url('${loginSignUpBG}')`, backgroundRepeat:"no-repeat", backgroundSize:'cover'}}>
                    </Stack>
                }

                {loginSignUp === 'login' ?
                    <Stack width={isMobile ? '100%' : '50%'} justifyContent='center' bgcolor='#EEE' borderRadius={isMobile ? '15px' : '0 15px 15px 0'} padding='0 35px'>
                        <Stack width='100%' height='95%' gap='50px' alignItems='center' justifyContent='center'>
                            <Typography variant='h3Caps'>Welcome Back!</Typography>
                            <form style={{width:'100%'}} onSubmit={handleLogin}>
                                <Stack gap='10px' marginBottom='50px'>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setLoginEmail(e.target.value)} fullWidth variant='standard' label='Email' type='email' required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setLoginPassword(e.target.value)} fullWidth variant='standard' label='Password' type='password' required/>
                                </Stack>
                                <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='smallErrorMsg'>{errorMessage}</Typography></Box>
                                <Button fullWidth variant='red' type='submit'>Login</Button>
                            </form>
                        </Stack>
                        <Box display='flex' alignItems='center' justifyContent='center' height='5%'>
                            <Typography variant='loginSignUp'>Don't have an account? <a href='#' onClick={() => changeLoginSignUp('signUp')}><Typography sx={{textDecoration:'underline', color:'#006DEE'}} variant='loginSignUp'>Sign Up</Typography></a></Typography>
                        </Box>
                    </Stack>
                    :
                    <Stack width={isMobile ? '100%' : '50%'} justifyContent='center' bgcolor='#EEE' borderRadius={isMobile ? '15px' : '0 15px 15px 0'} padding='0 35px'>
                        <Stack width='100%' height='95%' gap={!isMobile && '30px'} alignItems='center' justifyContent='center'>
                            <Typography variant='h3Caps'>Let's Get Started!</Typography>
                            <form style={{width:'100%'}} onSubmit={createAccount}>
                                <Stack gap='10px' marginBottom='50px'>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegUsername(e.target.value)} fullWidth variant='standard' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegFullName(e.target.value)} fullWidth variant='standard' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegEmail(e.target.value)} fullWidth variant='standard' label='Email' type='email' required/>
                                    <Box display='flex' gap='30px'>
                                        <FormControl variant='standard' className='dropdownList' fullWidth required>
                                            <InputLabel>Gender</InputLabel>
                                            <Select label='Gender' value={regGender} onChange={(e) => setRegGender(e.target.value)} required>
                                                {genders.map((gender) => {
                                                    return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                        <FormControl variant='standard' className='dropdownList' fullWidth required>
                                            <InputLabel>Region</InputLabel>
                                            <Select label='Region' value={regRegion} onChange={(e) => setRegRegion(e.target.value)} required>
                                                {regions.map((region) => {
                                                    return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <FormControl variant='standard' className='dropdownList' fullWidth required>
                                        <InputLabel>Sport(s)</InputLabel>
                                        <Select label='Sport(s)' sx={{textTransform:'uppercase', fontWeight:'bold', maxWidth:'315px'}} value={regSports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                            {sportsList?.map((sport) => {
                                                return <MenuItem value={sport.name} key={sport.name}>
                                                    <Checkbox checked={regSports.indexOf(sport.name) > -1} />
                                                    <Typography variant='action'>{sport.name}</Typography>
                                                </MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                    

                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegPassword(e.target.value)} fullWidth variant='standard' label='Password' type='password' required/>
                                    <TextField className='loginSignUpTextField' onChange={(e) => setRegConfirmPassword(e.target.value)} fullWidth variant='standard' label='Confirm password' type='password' required/>
                                </Stack>
                                <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='smallErrorMsg'>{errorMessage}</Typography></Box>
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