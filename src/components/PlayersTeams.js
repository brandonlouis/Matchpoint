import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { getDoc, getDocs, doc, collection, query, orderBy, where } from 'firebase/firestore';

export default function PlayersTeams() {
    const [teamList, setTeamList] = React.useState([])
    const [playerList, setPlayerList] = React.useState([])

    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTeams = async () => {
            try {
                const q = query(collection(db, 'teams'), where('privacy', '==', 'public'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTeamList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()
    }, [])
    // console.log(teamList)

    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Players & Teams</Typography>
                    <Box display='flex'>
                        <form style={{display:'flex'}}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => {}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {teamList.map((team) => (
                        <Grid key={team.id} item width='200px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{bgcolor:'#EEE', textAlign:'center', height:'150px', borderRadius:'15px'}} >
                                <CardActionArea sx={{height:'150px'}}>
                                    <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                        <Box display='flex' justifyContent='center' alignItems='center' gap='7px'>
                                            <img src={require('../img/icons/account.png')} height='20px'/>
                                            <Typography variant='subtitle2'>{team.members.length}/{team.maxCapacity}</Typography>
                                        </Box>
                                        <Typography variant='h5' marginTop='5px'>@{team.handle}</Typography>
                                        <Typography textTransform='capitalize' variant='subtitle4'>{team.name}</Typography>
                                        <Typography color='#888' variant='subtitle2' marginTop='5px'>{team.region}</Typography>
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