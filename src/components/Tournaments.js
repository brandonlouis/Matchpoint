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
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.date.end.toDate() >= new Date() && tournament.status !== 0) // Filter out tournaments that have already ended or are cancelled
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

    const viewTournament=(id)=>{
        window.location.href = `/ViewTournament?id=${id}`;
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Tournaments</Typography>
                    <Box display='flex'>
                        <TextField className='searchTextField' placeholder='SEARCH'/>
                        <Button variant='search'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {tournamentList.map((tournament) => (
                        <Grid key={tournament.id} item width='350px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{bgcolor:'#EEE', borderRadius:'15px'}} >
                                <CardActionArea onClick={() => viewTournament(tournament.id)}>
                                    <CardContent sx={{padding:'0'}}>
                                        <Stack>
                                            <Box height='180px' width='350px'>
                                                <img width='100%' height='100%' style={{objectFit:'cover'}} src={tournament.imgURL}/>
                                            </Box>
                                            <Stack height='100%' padding='15px 25px 30px' gap='15px'>
                                                <Box display='flex' justifyContent='space-between'>
                                                    <Typography textTransform='uppercase' variant='subtitle4'>{tournament.sport}</Typography>
                                                    {tournament.stringDate.start[2] === tournament.stringDate.end[2] ? 
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.stringDate.start[0]} {tournament.stringDate.start[1]} — {tournament.stringDate.end[1]}, {tournament.stringDate.end[2]}</Typography>
                                                        :
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.stringDate.start[0]} {tournament.stringDate.start[1]}, {tournament.stringDate.start[2]} — {tournament.stringDate.end[0]} {tournament.stringDate.end[1]}, {tournament.stringDate.end[2]}</Typography>
                                                    }
                                                </Box>
                                                <Box display='flex'>
                                                    <Typography className='multilineConcat' variant='h4'>
                                                        {tournament.date?.start.toDate() <= Date.now() && tournament.date?.end.toDate() >= Date.now() && <span style={{color:'#CB3E3E'}}>LIVE NOW: </span>}
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
