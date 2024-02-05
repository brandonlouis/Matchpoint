import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography, Checkbox, FormGroup, FormControlLabel, Tooltip, Zoom, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDocs, collection, orderBy, query } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function Tournaments() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const { user, moreUserInfo } = UserAuth()

    const [tournamentList, setTournamentList] = useState([])
    const [personalizedTournamentList, setPersonalizedTournamentList] = useState([])
    const [sports, setSports] = useState([])
    const [sportsList, setSportsList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [filterSearch, setFilterSearch] = useState('')
    
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
        getTournaments()
        getSports()

        user && !user.email.includes('@matchpoint.com') && setPersonalizedFilter(true)
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

    const concatSports = async (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )

        if (value.length > 0) {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && value.includes(tournament.sport) && tournament.title.toLowerCase().includes(filterSearch?.toLowerCase())) // Filter out tournaments that are cancelled and search criteria if not empty string

                setTournamentList(processDate(sortTournaments(resList)))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                if (filterSearch === '') {
                    const data = await getDocs(collection(db, 'tournaments'))
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that are cancelled
                    
                    setTournamentList(processDate(sortTournaments(resList)))
                } else {
                    setTournamentList(searchResults)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }

    const searchTournament = async (e) => {
        e.preventDefault()
        setSports([])
        setFilterSearch(searchCriteria)

        if (personalizedFilter) {
            try {
                searchCriteria === '' ? setTournamentList(personalizedTournamentList) : setTournamentList(processDate(sortTournaments(personalizedTournamentList.filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()))))))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()))) // Filter out tournaments that are cancelled
                
                setSearchResults(processDate(sortTournaments(resList)))
                setTournamentList(processDate(sortTournaments(resList)))
            } catch (err) {
                console.error(err)
            }
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='411px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems={!isTablet && 'center'}>
                    {isMobile ?
                        <Stack width='100%' gap={!user && '15px'}>
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
                            {!user &&
                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                        </Stack>
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
                        <Stack gap='15px'>
                            <form style={{display:'flex'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                            {!user &&
                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                        </Stack>
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
                            {!user &&
                                <FormControl className='dropdownList' sx={{width:'175px'}}>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                            <form style={{display:'flex'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                        </>
                    }
                    
                </Box>
                {tournamentList.length === 0 ? 
                    <Stack height='150px' marginTop='50px' alignItems='center' justifyContent='center'>
                        <Typography variant='h5'>No results found</Typography>
                    </Stack>
                    :
                    <Grid container spacing={4} alignItems='stretch' marginTop='25px'>
                        {tournamentList.map((tournament) => (
                            <Grid key={tournament.id} xs={12} sm={6} md={4} item borderRadius='15px' sx={{opacity: (tournament.date?.end.toDate() < new Date()) && '0.5'}}>
                                <Card sx={{bgcolor:'#EEE', borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.2)'}} >
                                    <CardActionArea onClick={() => window.location.href = `/ViewTournament?id=${tournament.id}`} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                        <CardContent sx={{padding:'0', width:'100%'}}>
                                            <Stack>
                                                <Box height='180px'>
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
                }
            </Stack>
        </Box>
    )
}
