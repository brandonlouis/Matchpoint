import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { getDocs, collection, query, where } from 'firebase/firestore';

export default function MyTournaments() {
    const { user } = UserAuth()    
    const [tournamentTab, setTournamentTab] = useState('hosted')

    const [teamID, setTeamID] = useState('')
    const [tournamentList, setTournamentList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    

    useEffect(() => { // Handle retrieving tournament list on initial load
        const getHosted = async () => {
            try {
                const q = query(collection(db, 'tournaments'), where('host', '==', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTournamentList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        const getCollaborating = async () => {
            try {
                const q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTournamentList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        const getParticipating = async () => {
            try {
                let teamResList = []
                try {
                    const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                    setTeamID(resList[0].id)

                    const teamQ = query(collection(db, 'tournaments'), where('participants', 'array-contains', resList[0].id))
                    const teamData = await getDocs(teamQ)
                    teamResList = teamData.docs.map((doc) => ({...doc.data(), id: doc.id}))
                } catch (err) {
                    console.error(err)
                }

                const q = query(collection(db, 'tournaments'), where('participants', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))

                setTournamentList(processDate([...resList, ...teamResList]))

                
            } catch (err) {
                console.error(err)
            }
        }

        if (tournamentTab === 'hosted') {
            getHosted()
        } else if (tournamentTab === 'collaborating') {
            getCollaborating()
        } else if (tournamentTab === 'participating') {
            getParticipating()
        }
    }, [tournamentTab])

        
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
            if (tournamentTab === 'participating') {
                const q = query(collection(db, 'tournaments'), where('participants', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))

                const teamQ = query(collection(db, 'tournaments'), where('participants', 'array-contains', teamID))
                const teamData = await getDocs(teamQ)
                const teamResList = teamData.docs.map((doc) => ({...doc.data(), id: doc.id}))

                const filteredCombinedList = [...resList, ...teamResList].filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport === searchCriteria.toLowerCase())) // Filter out tournaments that are cancelled
                setTournamentList(processDate(filteredCombinedList))
            } else {
                let q
                if (tournamentTab === 'hosted') {
                    q = query(collection(db, 'tournaments'), where('host', '==', user.uid))
                } else if (tournamentTab === 'collaborating') {
                    q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid))
                }
    
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && (tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport === searchCriteria.toLowerCase())) // Filter out tournaments that are cancelled
                
                setTournamentList(processDate(resList))
            }
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='500px' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' gap='50px' marginBottom='60px'>
                    <Button onClick={() => setTournamentTab('hosted')}><Typography className={tournamentTab === 'hosted' ? 'tournamentTab active' : 'tournamentTab'} variant='action'>Hosted Tournaments</Typography></Button>
                    <Button onClick={() => setTournamentTab('collaborating')}><Typography className={tournamentTab === 'collaborating' ? 'tournamentTab active' : 'tournamentTab'} variant='action'>Collaborating Tournaments</Typography></Button>
                    <Button onClick={() => setTournamentTab('participating')}><Typography className={tournamentTab === 'participating' ? 'tournamentTab active' : 'tournamentTab'} variant='action'>Participating Tournaments</Typography></Button>
                </Box>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>{tournamentTab} Tournaments</Typography>
                    <Box display='flex' alignItems='center' gap='15px'>
                        {tournamentTab === 'hosted' && user.emailVerified ? 
                            <Button style={{ height: '45px', width: '65px' }} onClick={() => (window.location.href = '/CreateTournament')} variant='green'><AddIcon sx={{ fontSize: '35px' }} /></Button>
                            :
                            <Button style={{ height: '45px', width: '65px' }} onClick={() => alert("Please verify your account before hosting a tournament")} variant='green'><AddIcon sx={{ fontSize: '35px' }} /></Button>
                        }
                        <form style={{display:'flex'}} onSubmit={searchTournament}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {tournamentList.map((tournament) => (
                        <Grid key={tournament.id} item width='350px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)' sx={{opacity: ((tournament.date?.end.toDate() < new Date()) || tournament.status === 0) && '0.5'}}>
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
                                                        {tournament.status === 0 ? <span style={{ color: '#888' }}>SUSPENDED: </span>
                                                            : tournament.date?.end.toDate() < Date.now() ? (
                                                                <span style={{ color: '#888' }}>ENDED: </span>
                                                            ) : tournament.date?.start.toDate() <= Date.now() && tournament.date?.end.toDate() >= Date.now() ? (
                                                                <span style={{ color: '#CB3E3E' }}>LIVE NOW: </span>
                                                            ) : null
                                                        }
                                                        
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