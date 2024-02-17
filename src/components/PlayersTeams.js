import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Checkbox, FormControlLabel, FormGroup, Grid, Stack, TextField, Tooltip, Typography, Zoom } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function PlayersTeams() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 620px)' })

    const { user, moreUserInfo } = UserAuth()

    const [isLoading, setIsLoading] = useState(true)

    const [resultList, setResultList] = useState([])
    const [personalizedPlayersTeamsList, setPersonalizedPlayersTeamsList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')

    const [personalizedFilter, setPersonalizedFilter] = useState(false)

    
    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTeams = async () => {
            try {
                const q = query(collection(db, 'teams'), orderBy('handle')) // Retrieve all team records in alphabetical order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => item.privacy === 'public') // Filter out private teams
                setResultList(resList)
                setIsLoading(false)
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()

        user && !user.email.includes('@matchpoint.com') && setPersonalizedFilter(true) // If user is logged in and not an admin, set personalized filter to true
    }, [])

    useEffect(() => { // Handle filtering players & teams based on filter criteria
        const getTeams = async () => { // Retrieve all team records
            if (personalizedFilter) {
                try {
                    const q = query(collection(db, 'teams'), orderBy('handle')) // Retrieve all team records in alphabetical order
                    const data = await getDocs(q)
    
                    const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.privacy === 'public' && (moreUserInfo?.gender === item.genderReq || item.genderReq === 'mixed') && moreUserInfo?.sportInterests.some((interest) => item.sports.includes(interest)) && moreUserInfo?.region === item.region) // Filter out private teams and teams that don't match user's profile

                    setResultList(resList)
                    setPersonalizedPlayersTeamsList(resList)
                } catch (err) {
                    console.error(err)
                }
            } else { // If personalized filter is off, retrieve all players & teams
                try {
                    const q = query(collection(db, 'teams'), orderBy('handle')) // Retrieve all team records in alphabetical order
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => item.privacy === 'public') // Filter out private teams
                    setResultList(resList)
                } catch (err) {
                    console.error(err)
                }
            }
        }
        getTeams()
    }, [personalizedFilter, moreUserInfo])

    const searchPlayerTeam = async (e) => { // Handle search functionality
        e.preventDefault() // Prevent page from refreshing

        if (personalizedFilter) { // If personalized filter is on, filter players & teams based on personalized criteria
            try {
                searchCriteria === '' ? setResultList(personalizedPlayersTeamsList) : setResultList(personalizedPlayersTeamsList.filter((item) => {
                    return ( // Filter out players & teams that don't match search criteria
                        item?.username?.includes(searchCriteria.toLowerCase()) || item?.fullName?.toLowerCase().includes(searchCriteria.toLowerCase()) || item?.handle?.includes(searchCriteria.toLowerCase()) || item?.name?.toLowerCase().includes(searchCriteria.toLowerCase())
                    )
                }))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                if (searchCriteria === '') { // If search criteria is empty, retrieve all team records
                    const q = query(collection(db, 'teams'), orderBy('handle'))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => item.privacy === 'public') // Filter out private teams
                    setResultList(resList)
                } else {
                    const accQ = query(collection(db, 'accounts'), orderBy('username')) // Retrieve all account records in alphabetical order
                    const accData = await getDocs(accQ)
                    const teamQ = query(collection(db, 'teams'), orderBy('handle')) // Retrieve all team records in alphabetical order
                    const teamData = await getDocs(teamQ)
    
                    const accList = accData.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.type !== 'admin') // Filter out admin accounts
                    const teamList = teamData.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.privacy === 'public') // Filter out private teams
    
                    const filteredList = [...accList, ...teamList].filter((item) => {
                        return ( // Filter out players & teams that don't match search criteria
                            item?.username?.includes(searchCriteria.toLowerCase()) || item?.fullName?.toLowerCase().includes(searchCriteria.toLowerCase()) || item?.handle?.includes(searchCriteria.toLowerCase()) || item?.name?.toLowerCase().includes(searchCriteria.toLowerCase())
                        )
                    })
                    setResultList(filteredList)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='280px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    {isMobile ? 
                        <Stack width='100%'>
                            <Typography variant='h3'>Players & Teams</Typography>
                            <Box display='flex'>
                                <form style={{display:'flex', width:'100%', paddingTop:'25px'}} onSubmit={searchPlayerTeam}>
                                    <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                    <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                                </form>
                            </Box>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title="Filter players and teams that match your profile (Gender, Region, Sport Interests)" arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                        </Stack>
                        : isTablet ?
                            <>
                            <Stack>
                                <Typography variant='h3'>Players & Teams</Typography>
                                {user && moreUserInfo?.type !== 'admin' &&
                                    <FormGroup>
                                        <Tooltip TransitionComponent={Zoom} title="Filter players and teams that match your profile (Gender, Region, Sport Interests)" arrow>
                                            <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                        </Tooltip>
                                    </FormGroup>
                                }
                            </Stack>
                            <Box display='flex'>
                                <form style={{display:'flex'}} onSubmit={searchPlayerTeam}>
                                    <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                    <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                                </form>
                            </Box>
                            </>
                        :
                        <>
                        <Typography variant='h3'>Players & Teams</Typography>
                        <Box display='flex' alignItems='center' gap='25px'>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title="Filter players and teams that match your profile (Gender, Region, Sport Interests)" arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                            <Box display='flex'>
                                <form style={{display:'flex'}} onSubmit={searchPlayerTeam}>
                                    <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                    <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                                </form>
                            </Box>
                        </Box>
                        </>
                    }
                    
                </Box>
                {resultList.length === 0 && !isLoading ?
                    <Stack height='150px' marginTop='50px' alignItems='center' justifyContent='center'>
                        <Typography variant='h5'>No results found</Typography>
                    </Stack>
                    :
                    <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                        {resultList.map((result) => (
                            result.username ? (
                                <Grid key={result.id} item width='150px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                    <Card sx={{ bgcolor: '#EEE', textAlign: 'center', height: '150px', borderRadius: '15px' }}>
                                        <CardActionArea sx={{ height: '150px' }} onClick={() => window.location.href = `/ViewProfile?id=${result.id}`}>
                                            <CardContent sx={{ margin: '16px', overflow: 'hidden' }}>
                                                <Typography variant='h5'>@{result.username}</Typography>
                                                <Typography textTransform='capitalize' variant='subtitle4'>{result.fullName}</Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ) : (
                                <Grid key={result.id} item width='200px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                    <Card sx={{ bgcolor: '#EEE', textAlign: 'center', height: '150px', borderRadius: '15px' }}>
                                        <CardActionArea sx={{ height: '150px' }} onClick={() => window.location.href = `/ViewProfile?id=${result.id}`}>
                                            <CardContent sx={{ margin: '16px', overflow: 'hidden' }}>
                                                <Box display='flex' justifyContent='center' alignItems='center' gap='7px'>
                                                    <img src={require('../img/icons/account.png')} height='20px' alt="Account Icon" />
                                                    <Typography variant='subtitle2'>{result?.members?.length}/{result.maxCapacity}</Typography>
                                                </Box>
                                                <Typography variant='h5' marginTop='5px'>@{result.handle}</Typography>
                                                <Typography textTransform='capitalize' variant='subtitle4'>{result.name}</Typography>
                                                <Typography color='#888' variant='subtitle2' marginTop='5px'>{result.region}</Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            )
                        ))}
                    </Grid>
                }
            </Stack>
        </Box>
    )
}