import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { getDoc, getDocs, updateDoc, doc, collection } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function ManageTournaments() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const [openModal, setOpenModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)

    const [tournamentList, setTournamentList] = useState([])
    const [tournamentDetails, setTournamentDetails] = useState({})
    
    const [searchCriteria, setSearchCriteria] = useState('')


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
                stringDate: {
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
            stringDate: {
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

    const suspendTournament = async (id) => { // Handle suspend record
        try {
            await updateDoc(doc(db, 'tournaments', id), {
                status: 0
            })
            alert('Tournament suspended successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const searchTournament = async (e) => {
        e.preventDefault()
        try {
            const data = await getDocs(collection(db, 'tournaments'))
            const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((tournament) => tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()) || tournament.sport === searchCriteria.toLowerCase())
            
            setTournamentList(processDateListDate(resList))
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <>
        <Box height='100%' width='100%' minHeight='411px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                {isMobile ?
                    <Stack justifyContent='center' gap='25px'>
                        <Typography variant='h3'>Manage Tournaments</Typography>
                        <Box>
                            <form style={{display:'flex'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                    </Stack>
                    :
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant='h3'>Manage Tournaments</Typography>
                        <Box>
                            <form style={{display:'flex'}} onSubmit={searchTournament}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                    </Box>
                }
                {tournamentList.length === 0 ?
                    <Stack height='150px' marginTop='50px' alignItems='center' justifyContent='center'>
                        <Typography variant='h5'>No results found</Typography>
                    </Stack>
                    :
                    <Grid container spacing={4} alignItems='stretch' marginTop='25px'>
                        {tournamentList.map((tournament) => (
                            <Grid key={tournament.id} xs={12} sm={6} md={4} item borderRadius='15px' sx={{opacity: (tournament.status === 0 || tournament.date?.end.toDate() < new Date()) && '0.5'}}>
                                <Card sx={{bgcolor:'#EEE', borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.2)'}} >
                                    <CardActionArea onClick={() => viewTournament(tournament.id)} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                        <CardContent sx={{padding:'0', width:'100%'}}>
                                            <Stack>
                                                <Box height='180px'>
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
                                                            {tournament.status === 0 && 
                                                                <span style={{color:'#CB3E3E'}}>SUSPENDED: </span>
                                                            }
                                                            {tournament.date?.end.toDate() < new Date() &&
                                                                <span style={{color:'#888'}}>ENDED: </span>
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
                }
            </Stack>
        </Box>
        <Modal open={openModal} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='90%' maxWidth='700px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%'>
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
                                    <td>
                                        <Typography variant='subtitle2'>Title:</Typography>
                                    </td>
                                    <td className='doubleLineConcat'>
                                        <Typography variant='subtitle3'>
                                            {tournamentDetails.title}
                                        </Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Description:</Typography>
                                    </td>
                                    <td className='tripleLineConcat'>
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
                                            {tournamentDetails.date?.start.toDate().toDateString() === tournamentDetails.date?.end.toDate().toDateString() ? (
                                                `${tournamentDetails.stringDate?.start[0]} ${tournamentDetails.stringDate?.start[1]}, ${tournamentDetails.stringDate?.start[2]}`
                                            ) : (
                                                tournamentDetails.stringDate?.start[2] === tournamentDetails.stringDate?.end[2] ? (
                                                    tournamentDetails.stringDate.start[0] === tournamentDetails.stringDate.end[0] ? (
                                                        `${tournamentDetails.stringDate.start[0]} ${tournamentDetails.stringDate.start[1]} — ${tournamentDetails.stringDate.end[1]}, ${tournamentDetails.stringDate.end[2]}`
                                                    ): (
                                                        `${tournamentDetails.stringDate.start[0]} ${tournamentDetails.stringDate.start[1]} — ${tournamentDetails.stringDate.end[0]} ${tournamentDetails.stringDate.end[1]}, ${tournamentDetails.stringDate.end[2]}`
                                                    )
                                                ) : (
                                                    `${tournamentDetails.stringDate?.start[0]} ${tournamentDetails.stringDate?.start[1]}, ${tournamentDetails.stringDate?.start[2]} — ${tournamentDetails.stringDate?.end[0]} ${tournamentDetails.stringDate?.end[1]}, ${tournamentDetails.stringDate?.end[2]}`
                                                )
                                            )}
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
                        {tournamentDetails.status === 1 && tournamentDetails.date?.end.toDate() > new Date() &&
                            <Button onClick={() => setOpenConfirmation(true)} fullWidth variant='red' sx={{marginTop:'25px'}}>Suspend Tournament</Button>
                        }
                    </Stack>
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Suspend Tournament
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to suspend this tournament?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => suspendTournament(tournamentDetails.id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}
