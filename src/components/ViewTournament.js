import React, { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { db, auth } from '../config/firebase';
import { getDoc, doc } from 'firebase/firestore';

export default function ViewTournament() {
    const tournamentID = new URLSearchParams(window.location.search).get("id")
    
    const [tournamentDetails, setTournamentDetails] = useState({})

    useEffect(() => {
        const getTournament = async () => {
            try {
                const res = await getDoc(doc(db, 'tournaments', tournamentID))
                const resList = res.data()
                setTournamentDetails(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getTournament()
    }, [])
    
    const processDate = (tournament) => {
        const startDateList = tournament.date.start.toDate().toDateString().split(' ').slice(1)
        const endDateList = tournament.date.end.toDate().toDateString().split(' ').slice(1)

        return {
            ...tournament,
            stringDate: {
              start: startDateList,
              end: endDateList,
            },
        }
    }

    const viewMatch=(id)=>{
        window.location.href = `/ViewMatch?id=${id}`;
    }
    // TODO: Tournament registration, login to register


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%' gap='20px'>
                <img src={tournamentDetails.imgURL}/>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Stack gap='50px' width='100%'>
                        <Typography variant='h2'>
                            {tournamentDetails.date?.start.toDate() <= Date.now() && tournamentDetails.date?.end.toDate() >= Date.now() && <span style={{color:'#CB3E3E'}}>LIVE NOW: </span>}
                            {tournamentDetails.title}
                        </Typography>
                        
                        <Box display='flex' justifyContent='space-between'>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='70px' src={require('../img/icons/trophy.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Grand Prize</Typography>
                                    <Typography textTransform='capitalize' variant='subtitle1'>{tournamentDetails.prizes?.first}</Typography>
                                </Stack>
                            </Box>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='70px' src={require('../img/icons/calendar.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Tournament Date</Typography>
                                    {tournamentDetails.stringDate?.start[2] === tournamentDetails.stringDate?.end[2] ? 
                                        <Typography variant='subtitle1'>{tournamentDetails.stringDate?.start[0]} {tournamentDetails.stringDate?.start[1]} — {tournamentDetails.stringDate?.end[1]}, {tournamentDetails.stringDate?.end[2]}</Typography>
                                        :
                                        <Typography variant='subtitle1'>{tournamentDetails.stringDate?.start[0]} {tournamentDetails.stringDate?.start[1]}, {tournamentDetails.stringDate?.start[2]} — {tournamentDetails.stringDate?.end[0]} {tournamentDetails.stringDate?.end[1]}, {tournamentDetails.stringDate?.end[2]}</Typography>
                                    }
                                </Stack>
                            </Box>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='70px' src={require('../img/icons/location.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Venue</Typography>
                                    <Typography textTransform='capitalize' variant='subtitle1'>{tournamentDetails.venue}</Typography>
                                </Stack>
                            </Box>
                        </Box>

                        <Typography variant='body1'>{tournamentDetails.description}</Typography>

                        <Box display='flex' justifyContent='space-between'>
                            <Stack width='50%' gap='30px'>
                                <Typography textTransform='uppercase' variant='h5'>Tournament Summary</Typography>

                                <table>
                                    <tbody>
                                        <tr>
                                            <td width='85px'>
                                                <Typography variant='subtitle2'>Sport:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.sport}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Type:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.type}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Gender:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.gender}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Format:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.format}</Typography>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Stack>
                            <Stack width='50%' gap='30px'>
                                <Typography textTransform='uppercase' variant='h5'>Prizes</Typography>

                                <table>
                                    <tbody>
                                        <tr>
                                            <td width='50px'>
                                                <Typography color='#D0AF00' variant='subtitle2'>1ST</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.first}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography color='#888' variant='subtitle2'>2ND</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.second}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography color='#AA6600' variant='subtitle2'>3RD</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.third}</Typography>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Stack>
                        </Box>
                        
                        <Box display='flex' justifyContent='center' marginTop='25px'>

                        { tournamentDetails.date?.start.toDate() <= Date.now() && tournamentDetails.date?.end.toDate() >= Date.now() ? ( // If tournament is live
                            <Button sx={{ width: '300px' }} variant="red" onClick={() => {viewMatch(tournamentID)}}>View Match</Button>
                            ) : !auth.currentUser ? ( // If user is not logged in
                                <Button variant="red" disabled>Login to register for this tournament</Button>
                            ) : auth.currentUser && !auth.currentUser.email.includes('@matchpoint.com') ? ( // If user is logged in but not admin
                                <Button variant="red">Register for this tournament</Button>
                            ) : <></>
                        }
                        </Box>
                    </Stack>
                </Box>
            </Stack>
        </Box>
  )
}
