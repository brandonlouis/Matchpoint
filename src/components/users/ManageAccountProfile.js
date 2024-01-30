import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { getDoc, getDocs, updateDoc, collection, doc, where, query, orderBy, sum } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { Chart as chartjs, LineElement, CategoryScale, LinearScale, PointElement, Tooltip as ChartTooltip  } from 'chart.js';

chartjs.register(
    LineElement, CategoryScale, LinearScale, PointElement, ChartTooltip
)

export default function ManageAccountProfile() {
    const { user, moreUserInfo, emailVerification } = UserAuth()
    const { changeEmail, changePassword } = UserAuth()

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
    const [matchInfo, setmatchInfo] = useState([])
    const [tournamentList, setTournamentList] = useState([])

    const [tournamentDatePoints, setTournamentDatePoints] = useState({})

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
        const getTournament = async () => {            
            const q = query(collection(db, 'tournaments'), where('participants', 'array-contains', user.uid))
            const data = await getDocs(q)
            const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
            setTournamentList(processDate([...resList]))                
        }
        const processDate = (list) => {
            const updatedTournamentList = list.map((tournament) => {
                const startDate = tournament.date.start.toDate().toDateString().split(' ').slice(1)
                const endDate = tournament.date.end.toDate().toDateString().split(' ').slice(1) 
                return {
                    ...tournament,
                    stringDate: {                        
                        start: startDate,
                        end: endDate,
                    },
                }
            })
            return updatedTournamentList
        }        
        const getMatch = async () => {
            try {
                const q = query(collection(db, 'matches'), where('participants', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setmatchInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
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
                const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTeamInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
        getAccount()
        getProfile()
        getTeam()
        getMatch()
        getTournament()
    }, [])

    useEffect(() => {
        const datePointsDict = {}
        const placementDict = {first: 0, second: 0, third: 0, tournamentsParticipated: 0}

        tournamentList.forEach((tournament) => {
            matchInfo.forEach((match) => {
                if (match.id === tournament.id) {
                    if (tournament.date?.end.toDate() < Date.now()) {
                        const sortedUsers = Object.entries(match.statistics).sort((a, b) => b[1].points - a[1].points)
                        const userIndex = sortedUsers.findIndex(([id, _]) => id === user.uid)
                        
                        placementDict.tournamentsParticipated += 1

                        const dateKey = tournament.stringDate?.end.join(' ')
                        if (userIndex === 0) {
                            datePointsDict[dateKey] = (datePointsDict[dateKey] || 0) + 4
                            placementDict.first += 1
                        } else if (userIndex === 1) {
                            datePointsDict[dateKey] = (datePointsDict[dateKey] || 0) + 3
                            placementDict.second += 1
                        } else if (userIndex === 2) {
                            datePointsDict[dateKey] = (datePointsDict[dateKey] || 0) + 2
                            placementDict.third += 1
                        } else {
                            datePointsDict[dateKey] = (datePointsDict[dateKey] || 0) + 1
                        }
                    }
                }
            })
            setTournamentDatePoints(datePointsDict)
        })
        if (Object.keys(datePointsDict).length > 0) {
            updateStatistics(placementDict)
        }
    }, [tournamentList, matchInfo])

    const updateStatistics = async (placementParam) => {
        try {
            await updateDoc(doc(db, 'profiles', user.uid), {
                first: placementParam.first,
                second: placementParam.second,
                third: placementParam.third,
                tournamentsParticipated: placementParam.tournamentsParticipated
            })
        } catch (err) {
            console.error(err)
        }
    }

    const concatSports = (e) => {
        const {target: {value}} = e
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

                try {
                    await changeEmail(email.toLowerCase())
                    await changePassword(newPassword)
                    await updateDoc(doc(db, 'accounts', user.uid), {
                        username: username.toLowerCase(),
                        fullName: fullName.trim().toLowerCase(),
                        email: email.toLowerCase(),
                        gender: gender.toLowerCase(),
                        region: region,
                        sportInterests: sports.slice().sort()
                    })
                    alert('Account updated successfully')
                    window.location.reload()
                } catch (err) {
                    console.error(err)
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    const revertChanges = () => {
        setUsername(originalDetails.username)
        setFullName(originalDetails.fullName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
        setEmail(originalDetails.email)
        setGender(originalDetails.gender)
        setRegion(originalDetails.region)
        setSports(originalDetails.sportInterests)
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

    const verifyEmail = async () => {
        await emailVerification(user)
        alert(`Verification email has been sent to ${moreUserInfo.email}`)
    }

    const datePointsArray = Object.entries(tournamentDatePoints).sort((a, b) => new Date(a[0]) - new Date(b[0]))
    const sortedDates = (datePointsArray.map(([date]) => date))
    const sortedScores = (datePointsArray.map(([, score]) => score))

    const graphData = ({
        labels: sortedDates,
        datasets: [{
            label: 'Total points',
            data: sortedScores,
            backgroundColor: '#CB3E3E',
            borderColor: '#666',
            pointBorderColor: '#CB3E3E',
            borderWidth: 2,
        }]
    })
    const graphConfig = ({
        type: 'line',
        graphData,
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                    },
                },
                y: {
                    beginAtZero: true,
                    stepSize: 1,
                    max: sortedScores.length > 0 ? Math.max(...sortedScores)+1 : 1,
                    title: {
                        display: true,
                        text: 'Total points',
                    },
                },
            },
        },
    })


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
                        <Box display='flex' alignContent='center'>
                            <Typography variant='h3'>{editMode && 'Edit'} Account</Typography>
                        </Box>
                        <form style={{marginTop:'50px'}} onSubmit={updateAccount}>
                            <Stack gap='25px'>
                                <TextField value={username} onChange={(e) => setUsername(e.target.value)}className='inputTextField' variant='outlined' label='Username' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required disabled={!editMode}/>
                                <TextField value={fullName} onChange={(e) => setFullName(e.target.value)} className='inputTextField' variant='outlined' label='Full Name' inputProps={{pattern:'^[^0-9]+$'}} required disabled={!editMode}/>
                                <Stack gap='10px'>
                                    <TextField value={email} onChange={(e) => setEmail(e.target.value)} className='inputTextField' variant='outlined' label='Email' type='email' required disabled={!editMode}/>
                                    {!user.emailVerified && <Button sx={{height: '30px', width: 'fit-content'}} variant='red' onClick={() => verifyEmail()}>Verify Email</Button>}
                                </Stack>

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
                                    
                                    <Box display='flex' gap='50px' justifyContent='flex-start'>
                                        {editMode ?
                                            <>
                                                <Button sx={{width:'250px'}} variant='blue' type='submit'>Save Changes</Button>
                                                <Button sx={{width:'120px'}} variant='red' onClick={() => {toggleEditMode(false); revertChanges()}}>Back</Button>
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
                        <Box display='flex' alignContent='center'>
                            <Typography variant='h3'>Profile</Typography>
                        </Box>
                        <Box display='flex' gap='50px'>
                            <Stack alignItems='center' justifyContent='center' gap='10px' padding='30px'>
                                <Stack gap='5px'>
                                    <Typography variant='h5'>@{moreUserInfo?.username}</Typography>
                                    <Typography textTransform='capitalize' textAlign='center' variant='subtitle4'>{moreUserInfo?.fullName}</Typography>
                                </Stack>
                                <Typography color='#888' variant='subtitle2'>{moreUserInfo?.region}</Typography>
                            </Stack>

                            <Stack gap='50px' width='100%'>
                                <Stack gap='25px'>
                                    <Stack gap='10px'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Team</Typography>
                                        <hr width='100%'/>
                                    </Stack>
                                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                                        {teamInfo[0] ?
                                            <>
                                                <Typography variant='body1'  color='#222'>@{teamInfo[0].handle}</Typography>
                                                <Button sx={{height:'30px'}} variant='blue' onClick={() => {teamInfo[0].leader == user.uid ? window.location.href='/ManageTeam' : window.location.href=`ViewProfile?id=${teamInfo[0]?.id}`}}>View Team</Button>
                                            </>
                                            :
                                            <>
                                                <Typography variant='body1'>Not in a team</Typography>
                                                <Box display='flex' gap='10px'>
                                                    <Button sx={{height:'30px'}} variant='blue' onClick={() => window.location.href='/PlayersTeams'}>Join a Team</Button>
                                                    <Button sx={{ height: '30px' }} variant='blue' onClick={() => {user.emailVerified ? window.location.href = '/CreateTeam' : alert("Please verify your account before creating a team")}}>Create a Team</Button>
                                                </Box>
                                            </>
                                        }
                                    </Box>
                                </Stack>

                                <Stack gap='25px'>
                                    <Stack gap='10px'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                        <hr width='100%'/>
                                    </Stack>
                                    <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                            <Box display='flex' gap='25px'>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/first.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/second.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../../img/icons/third.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.third}</Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Tournaments Played</Typography>
                                            <Box display='flex'>
                                                <Typography variant='body1' color='#222'>{profileInfo?.tournamentsParticipated}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                    <Stack paddingTop='8px'>
                                        <Typography fontWeight='bold' variant='body1'>Performance Chart</Typography>
                                        <Box position='relative' display='flex' justifyContent='center'>
                                            <Line data={graphData} options={graphConfig.options} />
                                            {(sortedDates.length === 0 || sortedScores.length === 0) &&
                                                <Box position='absolute' top='0' left='7%' right='0' bottom='0' display='flex' justifyContent='center' alignItems='center'>
                                                    <Typography color='#CB3E3E' fontWeight='bold' variant='body1' width='fit-content'>You have yet to participate in any tournaments</Typography>
                                                </Box>
                                            }
                                        </Box>
                                        <Typography variant='body2' textAlign='center' fontWeight='bold' display='flex' justifyContent='space-evenly'><span style={{color:'#D0AF00'}}>Gold = 4 points</span><span style={{color:'#888'}}>Silver = 3 points</span><span style={{color:'#AA6600'}}>Bronze = 2 points</span><span>Consolation = 1 point</span></Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>
                }
            </Box>
        </Box>
    )
}