import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, Typography, Tooltip } from '@mui/material';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDoc, getDocs, updateDoc, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { Chart as chartjs, LineElement, CategoryScale, LinearScale, PointElement, Tooltip as ChartTooltip } from 'chart.js';
import { useMediaQuery } from 'react-responsive';

chartjs.register(
    LineElement, CategoryScale, LinearScale, PointElement, ChartTooltip
)

export default function ViewProfile() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust790 = useMediaQuery({ query: '(max-width: 790px)' })
    const adjust740 = useMediaQuery({ query: '(max-width: 740px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })
    const adjust400 = useMediaQuery({ query: '(max-width: 400px)' })

    const { user, moreUserInfo } = UserAuth()
    const profileID = new URLSearchParams(window.location.search).get("id")

    const [openViewModal, setOpenViewModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)

    const [playerTeamDetails, setPlayerTeamDetails] = useState({})
    const [teamInfo, setTeamInfo] = useState([{}])
    const [profileInfo, setProfileInfo] = useState({})
    const [userTeam, setUserTeam] = useState({})
    const [accountsList, setAccountsList] = useState([{}])
    const [accountDetails, setAccountDetails] = useState({})
    const [matchInfo, setmatchInfo] = useState([])        
    const [tournamentList, setTournamentList] = useState([])

    const [tournamentDatePoints, setTournamentDatePoints] = useState({})


    useEffect(() => {
        const getTournament = async () => {            
            const q = query(collection(db, 'tournaments'), where('participants', 'array-contains', profileID))
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
                const q = query(collection(db, 'matches'), where('participants', 'array-contains', profileID))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setmatchInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getPlayerTeam = async () => {
            try {
                const accountDocRef = doc(db, 'accounts', profileID)
                const teamDocRef = doc(db, 'teams', profileID)
        
                const accountDocSnapshot = await getDoc(accountDocRef)
                const teamDocSnapshot = await getDoc(teamDocRef)
        
                if (accountDocSnapshot.exists()) {
                    getTeam()
                    const accountDetails = accountDocSnapshot.data()
                    setPlayerTeamDetails(accountDetails)
                } else if (teamDocSnapshot.exists()) {
                    const teamDetails = {id: teamDocSnapshot.id, ...teamDocSnapshot.data()}
                    if (teamDetails.privacy === 'private' && !teamDetails.members.includes(user.uid)) {
                        window.location.href = '/PlayersTeams' // Redirects to PlayersTeams page if team is private and user is not a member
                        return
                    }
                    if (user) { // Only retrieve accounts when user is logged in
                        getAccounts(teamDetails)
                    }
                    setPlayerTeamDetails(teamDetails)
                }
            } catch (err) {
                console.error(err)
            }
        }
        const getProfile = async () => {
            try {
                const res = await getDoc(doc(db, 'profiles', profileID))
                const resList = res.data()
                setProfileInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getTeam = async () => { // Retrieve team info
            try {
                const q = query(collection(db, 'teams'), where('members', 'array-contains', profileID))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTeamInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getUserTeam = async () => { // Retrieve user's team to check if user belongs in a team
            if (user) { // Only retrieve accounts when user is logged in
                try {
                    const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                    setUserTeam(resList)
                } catch (err) {
                    console.error(err)
                }
            }
        }
        getPlayerTeam()
        getProfile()
        getUserTeam()
        getTournament()
        getMatch()
    }, [])

    useEffect(() => {
        const datePointsDict = {}
        const placementDict = {first: 0, second: 0, third: 0, tournamentsParticipated: 0}

        tournamentList.forEach((tournament) => {
            matchInfo.forEach((match) => {
                if (match.id === tournament.id) {
                    if (tournament.date?.end.toDate() < Date.now()) {
                        const sortedUsers = Object.entries(match.statistics).sort((a, b) => b[1].points - a[1].points)
                        const userIndex = sortedUsers.findIndex(([id, _]) => id === profileID)
                        
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
            await updateDoc(doc(db, 'profiles', profileID), {
                first: placementParam.first,
                second: placementParam.second,
                third: placementParam.third,
                tournamentsParticipated: placementParam.tournamentsParticipated
            })
        } catch (err) {
            console.error(err)
        }
    }

    const joinTeam = async () => {
        try {
            await updateDoc(doc(db, 'teams', profileID), {
                members: [...playerTeamDetails?.members, user.uid]
            })
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const getAccounts = async (membersList) => {
        try {
            const q = query(collection(db, 'accounts'), orderBy('username'))
            const data = await getDocs(q)
            const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => membersList?.members?.includes(item.id))
            setAccountsList(resList)
        } catch (err) {
            console.error(err)
        }
    }

    const viewAccount = async (id) => { // Handle view record by populating data to modal
        setOpenViewModal(true)
        try {
            const resList = await getDoc(doc(db, 'accounts', id))
            const appendID = resList.data()
            appendID.id = id // Append id to list
            setAccountDetails(appendID)
        } catch (err) {
            console.error(err)
        }
    }

    const leaveTeam = async () => {
        try {
            await updateDoc(doc(db, 'teams', playerTeamDetails?.id), {
                members: playerTeamDetails?.members.filter(member => member !== user.uid)
            })
            alert('You have left the team')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
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
                    autoSkip: false,
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
        <>
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Box width={isMobile || isTablet ? '90%' : '80%'} display='flex' gap='100px'>
                {playerTeamDetails.username ?
                    <Stack width='100%' gap='50px'>
                        <Box display='flex' alignContent='center'>
                            <Typography variant='h3'>Player Profile</Typography>
                        </Box>
                        {adjust740 ? 
                            <Stack gap='50px'>
                                <Stack alignItems='center' justifyContent='center' gap='10px' padding={!isTablet && '30px'}>
                                    <Stack gap='5px'>
                                        <Typography variant='h5'>@{playerTeamDetails?.username}</Typography>
                                        <Typography textTransform='capitalize' textAlign='center' variant='subtitle4'>{playerTeamDetails?.fullName}</Typography>
                                    </Stack>
                                    <Typography color='#888' variant='subtitle2'>{playerTeamDetails?.region}</Typography>
                                </Stack>

                                <Stack gap='50px' width='100%'>
                                    <Stack gap='25px'>
                                        <Stack gap='10px'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Team</Typography>
                                            <hr/>
                                        </Stack>
                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                            {teamInfo[0] ?
                                                <>
                                                    <Typography variant='body1'  color='#222'>@{teamInfo[0].handle}</Typography>
                                                    <Button sx={{height:'30px'}} variant='blue' onClick={() => window.location.href = `/ViewProfile?id=${teamInfo[0].id}`}>View Team</Button>
                                                </>
                                                : 
                                                <Typography variant='body1'>Not in a team</Typography>
                                            }
                                        </Box>
                                    </Stack>

                                    <Stack gap='25px'>
                                        <Stack gap='10px'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                            <hr/>
                                        </Stack>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                            <Box display='flex' gap='25px'>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/first.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/second.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/third.png')}/>
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
                                            
                                        <Stack paddingTop='8px'>
                                            <Typography fontWeight='bold' variant='body1'>Performance Chart</Typography>
                                            <Box position='relative' display='flex' justifyContent='center'>
                                                <Line data={graphData} options={graphConfig.options} />
                                                {(sortedDates.length === 0 || sortedScores.length === 0) &&
                                                    <Box position='absolute' top='0' left='5%' right='0' bottom='0' display='flex' justifyContent='center' alignItems='center'>
                                                        <Typography color='#CB3E3E' fontWeight='bold' variant='body1' textAlign='center' width='fit-content'>Player has yet to participate in any tournaments</Typography>
                                                    </Box>
                                                }
                                            </Box>
                                            <Typography variant='body2' textAlign='center' fontWeight='bold' display='flex' justifyContent='space-evenly' flexDirection='column'><span style={{color:'#D0AF00'}}>Gold = 4 points</span><span style={{color:'#888'}}>Silver = 3 points</span><span style={{color:'#AA6600'}}>Bronze = 2 points</span><span>Consolation = 1 point</span></Typography>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                            :
                            <Box display='flex' gap='50px'>
                                <Stack alignItems='center' justifyContent='center' gap='10px' padding={!isTablet && '30px'}>
                                    <Stack gap='5px'>
                                        <Typography variant='h5'>@{playerTeamDetails?.username}</Typography>
                                        <Typography textTransform='capitalize' textAlign='center' variant='subtitle4'>{playerTeamDetails?.fullName}</Typography>
                                    </Stack>
                                    <Typography color='#888' variant='subtitle2'>{playerTeamDetails?.region}</Typography>
                                </Stack>

                                <Stack gap='50px' width='100%'>
                                    <Stack gap='25px'>
                                        <Stack gap='10px'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Team</Typography>
                                            <hr/>
                                        </Stack>
                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                            {teamInfo[0] ?
                                                <>
                                                    <Typography variant='body1'  color='#222'>@{teamInfo[0].handle}</Typography>
                                                    <Button sx={{height:'30px'}} variant='blue' onClick={() => window.location.href = `/ViewProfile?id=${teamInfo[0].id}`}>View Team</Button>
                                                </>
                                                : 
                                                <Typography variant='body1'>Not in a team</Typography>
                                            }
                                        </Box>
                                    </Stack>

                                    <Stack gap='25px'>
                                        <Stack gap='10px'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                            <hr/>
                                        </Stack>
                                        <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                            <Stack width='100%'>
                                                <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                                <Box display='flex' gap='25px'>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/first.png')}/>
                                                        <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                    </Box>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/second.png')}/>
                                                        <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                    </Box>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/third.png')}/>
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
                                                    <Box position='absolute' top='0' left='5%' right='0' bottom='0' display='flex' justifyContent='center' alignItems='center'>
                                                        <Typography color='#CB3E3E' fontWeight='bold' variant='body1' textAlign='center' width='fit-content'>Player has yet to participate in any tournaments</Typography>
                                                    </Box>
                                                }
                                            </Box>
                                            <Typography variant='body2' textAlign='center' fontWeight='bold' display='flex' justifyContent='space-evenly' flexDirection={isTablet && 'column'}><span style={{color:'#D0AF00'}}>Gold = 4 points</span><span style={{color:'#888'}}>Silver = 3 points</span><span style={{color:'#AA6600'}}>Bronze = 2 points</span><span>Consolation = 1 point</span></Typography>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Box>
                        }
                    </Stack>
                    :
                    (user && playerTeamDetails?.members?.includes(user.uid) && playerTeamDetails?.leader !== user.uid ?
                        <Stack width='100%' gap='50px'>
                            <Box display='flex' alignContent='center'>
                                <Typography variant='h3'>Team Profile</Typography>
                            </Box>
                            {adjust790 ?
                                <Stack gap='50px'>
                                    <Stack width='100%'>
                                        {adjust400 ?
                                            <>
                                            <Stack>
                                                <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                                <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                            </Stack>
                                            <hr/>
                                            <Stack marginTop='25px' gap='15px'>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                </Stack>
                                            </Stack>
                                            </>
                                            :
                                            <>
                                            <Box display='flex' gap='25px' alignItems='center'>
                                                <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                                <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                            </Box>
                                            <hr/>
                                            <Box display='flex' marginTop='25px'>
                                                <Stack gap='25px' width='50%'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Stack gap='25px' width='50%'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                            </>
                                        }
                                    </Stack>

                                    <Stack width='100%'>
                                        {adjust400 ?
                                            <Stack gap='10px'>
                                                <Box display='flex' gap='25px' alignItems='center'>
                                                    <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                                    <Typography color='#222'>{accountsList.length}/{playerTeamDetails?.maxCapacity}</Typography>
                                                </Box>
                                                <Button sx={{height:'30px'}} variant='red' onClick={() => setOpenConfirmation(true)}>Leave Team</Button>
                                            </Stack>
                                            :
                                            <Box display='flex' justifyContent='space-between'>
                                                <Box display='flex' gap='25px' alignItems='center'>
                                                    <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                                    <Typography color='#222'>{accountsList.length}/{playerTeamDetails?.maxCapacity}</Typography>
                                                </Box>
                                                <Button sx={{height:'30px'}} variant='red' onClick={() => setOpenConfirmation(true)}>Leave Team</Button>
                                            </Box>
                                        }
                                        
                                        <hr/>
                                        <Grid container gap='20px' marginTop='25px' alignItems='center'>
                                            {accountsList.map((account, index) => (
                                                <Grid key={account.id || index} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                                    <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                                        <CardActionArea onClick={() => viewAccount(account.id)}>
                                                            <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                                                {playerTeamDetails.leader === account.id && <img src={require('../img/icons/crown.png')} height='20px'/>}
                                                                <Typography variant='h5'>@{account.username}</Typography>
                                                                <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                                            </CardContent>
                                                        </CardActionArea>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </Stack>
                                :
                                <Box display='flex' gap='50px'>
                                    <Stack width='100%'>
                                        <Box display='flex' gap='25px' alignItems='center'>
                                            <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                            <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                        </Box>
                                        <hr/>
                                        {adjust400 ?
                                            <Stack marginTop='25px'>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                </Stack>
                                                <Stack>
                                                    <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                    <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                </Stack>
                                            </Stack>
                                            :
                                            <Box display='flex' marginTop='25px'>
                                                <Stack gap='25px' width='50%'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Stack gap='25px' width='50%'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        }
                                    </Stack>

                                    <Stack width='100%'>
                                        <Box display='flex' justifyContent='space-between'>
                                            <Box display='flex' gap='25px' alignItems='center'>
                                                <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                                <Typography color='#222'>{accountsList.length}/{playerTeamDetails?.maxCapacity}</Typography>
                                            </Box>
                                            <Button sx={{height:'30px'}} variant='red' onClick={() => setOpenConfirmation(true)}>Leave Team</Button>
                                        </Box>
                                        <hr/>
                                        <Grid container gap='20px' marginTop='25px' alignItems='center'>
                                            {accountsList.map((account, index) => (
                                                <Grid key={account.id || index} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                                    <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                                        <CardActionArea onClick={() => viewAccount(account.id)}>
                                                            <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                                                {playerTeamDetails.leader === account.id && <img src={require('../img/icons/crown.png')} height='20px'/>}
                                                                <Typography variant='h5'>@{account.username}</Typography>
                                                                <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                                            </CardContent>
                                                        </CardActionArea>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Stack>
                                </Box>
                            }
                            <Stack gap='25px'>
                                <Stack gap='10px'>
                                    <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                    <hr/>
                                </Stack>
                                {isMobile ?
                                    <>
                                    <Stack width='100%'>
                                        <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                        <Box display='flex' gap='25px'>
                                            <Box display='flex' gap='5px'>
                                                <img width='25px' src={require('../img/icons/first.png')}/>
                                                <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                            </Box>
                                            <Box display='flex' gap='5px'>
                                                <img width='25px' src={require('../img/icons/second.png')}/>
                                                <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                            </Box>
                                            <Box display='flex' gap='5px'>
                                                <img width='25px' src={require('../img/icons/third.png')}/>
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
                                    </>
                                    :
                                    <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                            <Box display='flex' gap='25px'>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/first.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/second.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/third.png')}/>
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
                                }
                                
                                <Stack paddingTop='8px'>
                                    <Typography fontWeight='bold' variant='body1'>Performance Chart</Typography>
                                    <Box position='relative' display='flex' justifyContent='center'>
                                        <Line data={graphData} options={graphConfig.options} />
                                        {(sortedDates.length === 0 || sortedScores.length === 0) &&
                                            <Box position='absolute' top='0' left='5%' right='0' bottom='0' display='flex' justifyContent='center' alignItems='center'>
                                                <Typography color='#CB3E3E' fontWeight='bold' variant='body1' textAlign='center' width='fit-content'>Team has yet to participate in any tournaments</Typography>
                                            </Box>
                                        }
                                    </Box>
                                    <Typography variant='body2' textAlign='center' fontWeight='bold' display='flex' justifyContent='space-evenly' flexDirection={isMobile && 'column'}><span style={{color:'#D0AF00'}}>Gold = 4 points</span><span style={{color:'#888'}}>Silver = 3 points</span><span style={{color:'#AA6600'}}>Bronze = 2 points</span><span>Consolation = 1 point</span></Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        :
                        <Box width='100%' display='flex' gap='100px'>
                            <Stack width='100%' gap='50px'>
                                <Box display='flex' alignContent='center'>
                                    <Typography variant='h3'>Team Profile</Typography>
                                </Box>

                                <Box display='flex' gap='50px'>
                                    <Stack width='100%'>
                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                            {adjust400 ? 
                                                <Stack>
                                                    <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                                    <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                                </Stack>
                                                :
                                                <Box display='flex' gap='25px' alignItems='center'>
                                                    <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                                    <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                                </Box>
                                            }
                                            
                                            {
                                                playerTeamDetails.leader !== user.uid ? 
                                                    user && !user.emailVerified && userTeam.length === 0 && parseInt(playerTeamDetails?.members?.length) < playerTeamDetails?.maxCapacity && (playerTeamDetails?.genderReq === moreUserInfo.gender || playerTeamDetails?.genderReq === 'mixed') && moreUserInfo?.sportInterests.some(r => playerTeamDetails?.sports?.includes(r)) ?
                                                        <Button variant='blue' sx={{height:'30px'}} onClick={joinTeam}>Join Team</Button>
                                                        :
                                                        <Tooltip title={
                                                            !user.emailVerified ?
                                                            "Please verify your email before joining a team" :
                                                            userTeam.length > 0 ?
                                                            "You are already in another team" :
                                                            playerTeamDetails?.members?.length >= playerTeamDetails?.maxCapacity ?
                                                            "Team is full" :
                                                            playerTeamDetails?.genderReq !== moreUserInfo?.gender && playerTeamDetails?.genderReq !== 'mixed' && !moreUserInfo?.sportInterests.some(r => playerTeamDetails?.sports?.includes(r)) ?
                                                            "Your gender and sport interests don't match the team's requirements" :
                                                            playerTeamDetails?.genderReq !== moreUserInfo?.gender && playerTeamDetails?.genderReq !== 'mixed' ?
                                                            "Your gender doesn't match the team's gender requirement" :
                                                            !moreUserInfo?.sportInterests.some(r => playerTeamDetails?.sports?.includes(r)) ?
                                                            "You don't have any sport interests that match the team's sports" :
                                                            ""
                                                        }>
                                                            <span>
                                                                <Button variant='red' sx={{height:'30px'}} disabled>Join Team</Button>
                                                            </span>
                                                        </Tooltip>
                                                :
                                                user && playerTeamDetails?.leader === user.uid && <Button variant='blue' sx={{height:'30px'}} onClick={() => window.location.href='/ManageTeam'}>Manage Team</Button>
                                            }
                                        </Box>
                                        <hr/>
                                        <Box display='flex' marginTop='25px'>
                                            {adjust740 ?
                                                <Stack gap='15px'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Capacity</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.members?.length}/{playerTeamDetails?.maxCapacity}</Typography>
                                                    </Stack>
                                                </Stack>
                                                :
                                                <Box display='flex' justifyContent='space-between' width='100%'>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.region}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.sports?.join(', ')}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.genderReq}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.privacy}</Typography>
                                                    </Stack>
                                                    <Stack>
                                                        <Typography fontWeight='bold' variant='body1'>Capacity</Typography>
                                                        <Typography variant='body1' color='#222' textTransform='capitalize'>{playerTeamDetails?.members?.length}/{playerTeamDetails?.maxCapacity}</Typography>
                                                    </Stack>
                                                </Box>
                                            }
                                        </Box>
                                    </Stack>
                                </Box>
                                <Stack gap='25px'>
                                    <Stack gap='10px'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                        <hr/>
                                    </Stack>
                                    {isMobile ?
                                        <>
                                        <Stack width='100%'>
                                            <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                            <Box display='flex' gap='25px'>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/first.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/second.png')}/>
                                                    <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                </Box>
                                                <Box display='flex' gap='5px'>
                                                    <img width='25px' src={require('../img/icons/third.png')}/>
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
                                        </>
                                        :
                                        <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                            <Stack width='100%'>
                                                <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                                <Box display='flex' gap='25px'>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/first.png')}/>
                                                        <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                                    </Box>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/second.png')}/>
                                                        <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                                    </Box>
                                                    <Box display='flex' gap='5px'>
                                                        <img width='25px' src={require('../img/icons/third.png')}/>
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
                                    }
                                    
                                    <Stack paddingTop='8px'>
                                        <Typography fontWeight='bold' variant='body1'>Performance Chart</Typography>
                                        <Box position='relative' display='flex' justifyContent='center'>
                                            <Line data={graphData} options={graphConfig.options} />
                                            {(sortedDates.length === 0 || sortedScores.length === 0) &&
                                                <Box position='absolute' top='0' left='5%' right='0' bottom='0' display='flex' justifyContent='center' alignItems='center'>
                                                    <Typography color='#CB3E3E' fontWeight='bold' variant='body1' textAlign='center' width='fit-content'>Team has yet to participate in any tournaments</Typography>
                                                </Box>
                                            }
                                        </Box>
                                        <Typography variant='body2' textAlign='center' fontWeight='bold' display='flex' justifyContent='space-evenly' flexDirection={isMobile && 'column'}><span style={{color:'#D0AF00'}}>Gold = 4 points</span><span style={{color:'#888'}}>Silver = 3 points</span><span style={{color:'#AA6600'}}>Bronze = 2 points</span><span>Consolation = 1 point</span></Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Box>
                    )
                }
            </Box>
        </Box>

        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>Member Details:</Typography>
                        <table>
                            <tbody>
                                <tr>
                                    <td width='120px'>
                                        <Typography variant='subtitle2'>Username:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.username}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Full Name:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.fullName}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Gender:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.gender}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Region:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize'variant='subtitle3'>{accountDetails.region}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Sport(s):</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize'variant='subtitle3'>{accountDetails?.sportInterests?.join(', ')}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Stack>
                    <Button variant='blue' onClick={() => window.location.href=`/ViewProfile?id=${accountDetails.id}`}>View Profile</Button>
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Leave Team
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to leave this team?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => leaveTeam()} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}