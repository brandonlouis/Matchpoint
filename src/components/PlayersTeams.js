import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function PlayersTeams() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 620px)' })

    const [resultList, setResultList] = React.useState([])

    const [searchCriteria, setSearchCriteria] = useState('')

    
    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTeams = async () => {
            try {
                const q = query(collection(db, 'teams'), orderBy('handle'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => item.privacy === 'public') // Filter out private teams
                setResultList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()
    }, [])

    const searchPlayerTeam = async (e) => { // Handle search functionality
        e.preventDefault()
        try {
            if (searchCriteria === '') { // If search criteria is empty, retrieve all team records
                const q = query(collection(db, 'teams'), orderBy('handle'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => item.privacy === 'public') // Filter out private teams
                setResultList(resList)
            } else {
                const accQ = query(collection(db, 'accounts'), orderBy('username'))
                const accData = await getDocs(accQ)
                const teamQ = query(collection(db, 'teams'), orderBy('handle'))
                const teamData = await getDocs(teamQ)

                const accList = accData.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.type !== 'admin')
                const teamList = teamData.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.privacy === 'public') // Filter out private teams

                const filteredList = [...accList, ...teamList].filter((item) => {
                    return (
                        item?.username?.includes(searchCriteria.toLowerCase()) || item?.fullName?.toLowerCase().includes(searchCriteria.toLowerCase()) || item?.handle?.includes(searchCriteria.toLowerCase()) || item?.name?.toLowerCase().includes(searchCriteria.toLowerCase())
                    )
                })
                setResultList(filteredList)
            }
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='280px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    {isMobile ? 
                        <Stack width='100%' gap='25px'>
                        <Typography variant='h3'>Players & Teams</Typography>
                            <Box display='flex'>
                                <form style={{display:'flex', width:'100%'}} onSubmit={searchPlayerTeam}>
                                    <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                    <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                                </form>
                            </Box>
                        </Stack>
                        :
                        <>
                        <Typography variant='h3'>Players & Teams</Typography>
                        <Box display='flex'>
                            <form style={{display:'flex'}} onSubmit={searchPlayerTeam}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                        </>
                    }
                    
                </Box>
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
            </Stack>
        </Box>
    )
}