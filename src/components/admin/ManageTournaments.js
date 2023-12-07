import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { getDoc, getDocs, doc, collection } from 'firebase/firestore';

export default function ManageTournaments() {
    const [openModal, setOpenModal] = useState(false)

    const [tournamentList, setTournamentList] = useState([])
    const [tournamentDetails, setTournamentDetails] = useState({})
    
    const [searchCriteria, setSearchCriteria] = useState('')

    // TODO: Handle search and SUSPEND functionality

    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTournaments = async () => {
            try {
                const data = await getDocs(collection(db, 'tournaments'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTournamentList(processDateListDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
    }, [])

    const processDateListDate = (list) => {
        const updatedTournamentList = list.map((tournament) => {
            const startDate = tournament.date.start.toDate().toDateString().split(' ').slice(1)
            const endDate = tournament.date.end.toDate().toDateString().split(' ').slice(1)

            return {
                ...tournament,
                date: {
                  start: startDate,
                  end: endDate,
                },
            }
        })
        return updatedTournamentList
    }
    const processDate = (tournament) => {
        const startDate = tournament.date.start.toDate().toDateString().split(' ').slice(1)
        const endDate = tournament.date.end.toDate().toDateString().split(' ').slice(1)

        return {
            ...tournament,
            date: {
                start: startDate,
                end: endDate,
            }
        }
    }

    const viewTournament = async (id) => { // Handle view record by populating data to modal
        setOpenModal(true)
        try {
            const resList = await getDoc(doc(db, 'tournaments', id))
            const appendID = resList.data()
            appendID.id = id // Append id to list
            setTournamentDetails(processDate(appendID))
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Manage Tournaments</Typography>
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
                                                    {tournament.date.start[2] === tournament.date.end[2] ? 
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.date.start[0]} {tournament.date.start[1]} — {tournament.date.end[1]}, {tournament.date.end[2]}</Typography>
                                                        :
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.date.start[0]} {tournament.date.start[1]}, {tournament.date.start[2]} — {tournament.date.end[0]} {tournament.date.end[1]}, {tournament.date.end[2]}</Typography>
                                                    }
                                                </Box>
                                                <Box display='flex'>
                                                    <Typography className='multilineConcat' variant='h4'>{tournament.title}</Typography>
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
        <Modal open={openModal} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='700px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack>
                    <img width='100%' height='150px' style={{objectFit:'cover', borderRadius:'20px 20px 0 0'}} src={tournamentDetails.imgURL}/>

                    <Stack padding='20px 40px 40px' gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>Tournament Details:</Typography>
                        <table style={{tableLayout:'fixed'}}>
                            <tbody>
                                <tr>
                                    <td width='130px'>
                                        <Typography variant='subtitle2'>ID:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{tournamentDetails.id}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Title:</Typography>
                                    </td>
                                    <td className='multilineConcat'>
                                        <Typography variant='subtitle3'>{tournamentDetails.title}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Description:</Typography>
                                    </td>
                                    <td className='multilineConcat'>
                                        <Typography fontWeight='regular' variant='subtitle3'>{tournamentDetails.description}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;
                                    </td>
                                    <td>
                                        &nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Date:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>
                                            {tournamentDetails.date?.start[2] === tournamentDetails.date?.end[2] ? 
                                                `${tournamentDetails.date?.start[0]} ${tournamentDetails.date?.start[1]} — ${tournamentDetails.date?.end[1]}, ${tournamentDetails.date?.end[2]}`
                                                :
                                                `${tournamentDetails.date?.start[0]} ${tournamentDetails.date?.start[1]}, ${tournamentDetails.date?.start[2]} — ${tournamentDetails.date?.end[0]} ${tournamentDetails.date?.end[1]}, ${tournamentDetails.date?.end[2]}`
                                            }    
                                        </Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Venue:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{tournamentDetails.venue}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Prizes:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>
                                            {tournamentDetails.prizes?.first}, {tournamentDetails.prizes?.second}, {tournamentDetails.prizes?.third}
                                        </Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;
                                    </td>
                                    <td>
                                        &nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Sport:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{tournamentDetails.sport}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Type:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{tournamentDetails.type}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Gender:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{tournamentDetails.gender}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Format:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{tournamentDetails.format}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <Button fullWidth variant='red' sx={{marginTop:'25px'}}>Suspend Tournament</Button>
                    </Stack>
                </Stack>
            </Box>
        </Modal>
        </>
    )
}
