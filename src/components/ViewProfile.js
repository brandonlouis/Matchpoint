import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDoc, getDocs, updateDoc, doc, collection, query, where, documentId } from 'firebase/firestore';

export default function ViewProfile() {
    const { user } = UserAuth()
    const profileID = new URLSearchParams(window.location.search).get("id")

    const [playerTeamDetails, setPlayerTeamDetails] = useState({})
    const [teamInfo, setTeamInfo] = useState([{}])
    const [profileInfo, setProfileInfo] = useState({})
    const [userTeam, setUserTeam] = useState({})
    const [accountsList, setAccountsList] = useState([{}])

    useEffect(() => {
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
                    const teamDetails = teamDocSnapshot.data()
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
            try {
                const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setUserTeam(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getPlayerTeam()
        getProfile()
        if (user) { // Only check if user belongs to a team when user is logged in
            getUserTeam()
        }
    }, [])

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
            const q = query(collection(db, 'accounts'), where(documentId(), 'in', membersList?.members))
            const data = await getDocs(q)
            const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
            setAccountsList(resList)
        } catch (err) {
            console.error(err)
        }
    }
    // TODO: Fix key prop unique ID bug, add "Leave Team" function

    
    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                {playerTeamDetails.username ?
                    <Stack width='100%' gap='50px'>
                        <Box display='flex' justifyContent='space-between' alignContent='center'>
                            <Typography variant='h3'>Player Profile</Typography>
                        </Box>
                        <Box display='flex' gap='50px'>
                            <Stack alignItems='center' justifyContent='center' gap='10px' padding='30px'>
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
                                        <hr width='100%'/>
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
                                        <hr width='100%'/>
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
                                </Stack>
                            </Stack>
                        </Box>
                    </Stack>
                    :
                    (user && playerTeamDetails?.members?.includes(user.uid) && playerTeamDetails?.leader != user.uid ?
                        <Stack width='100%' gap='100px'>
                            <Box display='flex' gap='50px'>
                                <Stack width='100%'>
                                    <Box display='flex' gap='25px' alignItems='center'>
                                        <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                        <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                    </Box>
                                    
                                    <hr width='100%'/>
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
                                </Stack>

                                <Stack width='100%'>
                                    <Box display='flex' justifyContent='space-between'>
                                        <Box display='flex' gap='25px' alignItems='center'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                            {/* <Typography color='#222'>{accountsList.length}/{maxCapacity}</Typography> */}
                                        </Box>
                                        <Button sx={{height:'30px'}} variant='red'>Leave Team</Button>
                                    </Box>
                                    <hr width='100%'/>
                                    <Grid container gap='20px' marginTop='25px' alignItems='center'>
                                        {accountsList.map((account) => (
                                            <Grid key={account.id} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                                <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                                    <CardActionArea>
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
                            </Stack>
                        </Stack>
                        :
                        <Box width='100%' display='flex' gap='100px'>
                            <Stack width='100%' gap='50px'>
                                <Box display='flex' justifyContent='space-between' alignContent='center'>
                                    <Typography variant='h3'>Team Profile</Typography>
                                </Box>

                                <Box display='flex' gap='50px'>
                                    <Stack width='100%'>
                                        <Box display='flex' justifyContent='space-between'>
                                            <Box display='flex' gap='25px' alignItems='center'>
                                                <Typography variant='h5'>{playerTeamDetails?.name}</Typography>
                                                <Typography color='#222'>@{playerTeamDetails?.handle}</Typography>
                                            </Box>
                                            {user && userTeam.length == 0 && parseInt(playerTeamDetails?.members?.length) < playerTeamDetails?.maxCapacity && <Button variant='blue' onClick={joinTeam}>Join Team</Button> }
                                            {user && userTeam[0]?.leader == user.uid && <Button variant='blue' onClick={() => window.location.href='/ManageTeam'}>Manage Team</Button> }
                                        </Box>
                                        
                                        <hr width='100%'/>
                                        <Box display='flex' marginTop='25px'>
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
                                        </Box>
                                    </Stack>
                                </Box>
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
                                </Stack>
                            </Stack>
                        </Box>
                    )
                    
                }
            </Box>
        </Box>
    )
}