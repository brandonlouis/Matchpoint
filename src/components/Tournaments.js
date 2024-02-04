import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography, Checkbox, FormGroup, FormControlLabel, Tooltip, Zoom } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDocs, collection } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function Tournaments() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const { user, moreUserInfo } = UserAuth()

    const [tournamentList, setTournamentList] = useState([])
    const [personalizedTournamentList, setPersonalizedTournamentList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    
    const [personalizedFilter, setPersonalizedFilter] = useState(false)


    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTournaments = async () => {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that are cancelled
                
                setTournamentList(processDate(sortTournaments(resList)))
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
        user && moreUserInfo?.type !== 'admin' && setPersonalizedFilter(true)
    }, [])

    useEffect(() => { // Handle filtering tournaments based on filter criteria
        const getTournaments = async () => {
            if (personalizedFilter) {
                try {
                    const data = await getDocs(collection(db, 'tournaments'))
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that are cancelled
                    
                    let updatedUserGender
                    if (moreUserInfo?.gender === 'male') { // Transform user's gender data to match tournament gender format
                        updatedUserGender = 'mens'
                    } else if (moreUserInfo?.gender === 'female') {
                        updatedUserGender = 'womens'
                    }
    
                    const filteredList = resList.filter((tournament) => {
                        const isMixed = tournament.gender === 'mixed' // Handle if tournament gender is 'mixed'
                        const isUserGenderMatch = tournament.gender === updatedUserGender
                        return (isMixed || isUserGenderMatch) && tournament.region === moreUserInfo?.region && moreUserInfo.sportInterests.includes(tournament.sport)
                    })

                    setTournamentList(processDate(sortTournaments(filteredList)))
                    setPersonalizedTournamentList(processDate(sortTournaments(filteredList)))
                } catch (err) {
                    console.error(err)
                }
            } else { // If personalized filter is off, retrieve all tournaments
                try {
                    const data = await getDocs(collection(db, 'tournaments'))
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that are cancelled
                    
                    setTournamentList(processDate(sortTournaments(resList)))
                } catch (err) {
                    console.error(err)
                }
            }
        }
        getTournaments()
    }, [personalizedFilter, moreUserInfo])

    const sortTournaments = (list) => {
        return list.sort((a, b) => {
            const now = new Date()
            const aEndDate = new Date(a.date.end.toDate())
            const bEndDate = new Date(b.date.end.toDate())
            const aStartDate = new Date(a.date.start.toDate())
            const bStartDate = new Date(b.date.start.toDate())

            // Check if tournaments are currently live
            const aIsLive = now >= aStartDate && now <= aEndDate
            const bIsLive = now >= bStartDate && now <= bEndDate

            // Sort by live status and end date
            if (aIsLive && bIsLive) {
                return aEndDate - bEndDate // Sort by end date if both are live
            } else if (aIsLive) {
                return -1 // a is live, should come first
            } else if (bIsLive) {
                return // b is live, should come first
            } else if (aStartDate > now && bStartDate > now) {
                return aStartDate - bStartDate // Sort by start date if both are not live
            } else {
                return bStartDate - aStartDate // Sort by start date in descending order
            }
        })
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

    const searchTournament = async (e) => {
        e.preventDefault()
        if (personalizedFilter) {
            try {
                const resList = personalizedTournamentList.filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport == searchCriteria.toLowerCase())) // Filter out tournaments that are cancelled
                
                setTournamentList(processDate(sortTournaments(resList)))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport == searchCriteria.toLowerCase())) // Filter out tournaments that are cancelled
                
                setTournamentList(processDate(sortTournaments(resList)))
            } catch (err) {
                console.error(err)
            }
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='411px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    {isMobile ?
                        <>
                        <Stack width='100%'>
                            <Typography variant='h3'>Tournaments</Typography>
                            <form style={{display:'flex', width:'100%', paddingTop:'25px'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title='Filter tournaments based on your profile information (Gender, Region, Sport Interests)' arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                        </Stack>
                        </>
                    : isTablet ?
                        <>
                        <Stack>
                            <Typography variant='h3'>Tournaments</Typography>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title='Filter tournaments based on your profile information (Gender, Region, Sport Interests)' arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                        </Stack>
                        <form style={{display:'flex'}} onSubmit={searchTournament}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                        </>
                        :
                        <>
                        <Typography variant='h3'>Tournaments</Typography>
                        <Box display='flex' alignItems='center' gap='25px'>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title='Filter tournaments based on your profile information (Gender, Region, Sport Interests)' arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }

                            <form style={{display:'flex'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                        </>
                    }
                    
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {tournamentList.map((tournament) => (
                        <Grid key={tournament.id} item width='350px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)' sx={{opacity: (tournament.date?.end.toDate() < new Date()) && '0.5'}}>
                            <Card sx={{bgcolor:'#EEE', borderRadius:'15px', height:'100%'}} >
                                <CardActionArea onClick={() => window.location.href = `/ViewTournament?id=${tournament.id}`} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                    <CardContent sx={{padding:'0'}}>
                                        <Stack>
                                            <Box height='180px' width='350px'>
                                                <img width='100%' height='100%' style={{objectFit:'cover'}} src={tournament.imgURL}/>
                                            </Box>
                                            <Stack height='100%' padding='15px 25px 30px' gap='15px'>
                                                <Stack>
                                                    <Box display='flex' justifyContent='space-between'>
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.sport}</Typography>
                                                        <Typography textTransform='uppercase' variant='subtitle4'>
                                                            {tournament.date.start.toDate().toDateString() === tournament.date.end.toDate().toDateString() ? (
                                                                `${tournament.stringDate.start[0]} ${tournament.stringDate.start[1]}, ${tournament.stringDate.start[2]}`
                                                            ) : (
                                                                tournament.stringDate.start[2] === tournament.stringDate.end[2] ? (
                                                                    tournament.stringDate.start[0] === tournament.stringDate.end[0] ? (
                                                                        `${tournament.stringDate.start[0]} ${tournament.stringDate.start[1]} — ${tournament.stringDate.end[1]}, ${tournament.stringDate.end[2]}`
                                                                    ): (
                                                                        `${tournament.stringDate.start[0]} ${tournament.stringDate.start[1]} — ${tournament.stringDate.end[0]} ${tournament.stringDate.end[1]}, ${tournament.stringDate.end[2]}`
                                                                    )
                                                                ) : (
                                                                    `${tournament.stringDate.start[0]} ${tournament.stringDate.start[1]}, ${tournament.stringDate.start[2]} — ${tournament.stringDate.end[0]} ${tournament.stringDate.end[1]}, ${tournament.stringDate.end[2]}`
                                                                )
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                    <Box display='flex' justifyContent='space-between'>
                                                        <Typography textTransform='uppercase' variant='subtitle4'>Region: {tournament.region}</Typography>
                                                        <Typography textTransform='uppercase' variant='subtitle4' maxWidth='150px' overflow='hidden' whiteSpace='nowrap' textOverflow='ellipsis'>Prize: {tournament.prizes.first !== '' ? tournament.prizes.first : "No Prize"}</Typography>
                                                    </Box>
                                                </Stack>
                                                <Box display='flex'>
                                                    <Typography className='doubleLineConcat' variant='h4'>
                                                        {tournament.date?.end.toDate() < Date.now() ? (
                                                            <span style={{ color: '#888' }}>ENDED: </span>
                                                        ) : tournament.date?.start.toDate() <= Date.now() && tournament.date?.end.toDate() >= Date.now() ? (
                                                            <span style={{ color: '#CB3E3E' }}>LIVE NOW: </span>
                                                        ) : null}
                                                        {tournament.title}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Box>
    )
}
