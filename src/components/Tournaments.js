import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { getDocs, collection } from 'firebase/firestore';

export default function Tournaments() {
    const [tournamentList, setTournamentList] = useState([])
    const [searchCriteria, setSearchCriteria] = useState('')

    
    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTournaments = async () => {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that have already ended or are cancelled
                setTournamentList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
    }, [])

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
        try {
            if (searchCriteria === '') { // If search criteria is empty, retrieve all records
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that have already ended or are cancelled
                setTournamentList(processDate(resList))
            } else {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport == searchCriteria.toLowerCase())) // Filter out tournaments that have already ended or are cancelled
                setTournamentList(processDate(resList))
            }
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Tournaments</Typography>
                    <Box display='flex'>
                        <form style={{display:'flex'}} onSubmit={searchTournament}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
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
