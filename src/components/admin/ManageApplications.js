import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { db } from '../../config/firebase';
import { getDocs, getDoc, doc, collection } from 'firebase/firestore';

export default function ManageApplications() {
    const [applicationsList, setApplicationsList] = useState([])
    const [searchCriteria, setSearchCriteria] = useState('')

    // TODO: Handle search functionality and accept/reject application
    
    useEffect(() => { // Handle retrieving account list on initial load
        const getApplications = async () => {
            try {
                const data = await getDocs(collection(db, 'eventCoordApplications'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setApplicationsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getApplications()
    },[])
    console.log(applicationsList)

    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Manage Applications</Typography>
                    <Box display='flex' gap='15px'>
                        <form style={{display:'flex'}}>
                            <TextField className='searchTextField' placeholder='SEARCH'/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='25px' alignItems='stretch' marginTop='50px'>
                    {applicationsList.map((application) => (
                        <Grid key={application.id} item width='200px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{bgcolor:'#EEE', textAlign:'center', height:'200px', borderRadius:'15px'}} >
                                <CardContent sx={{height:'150px', margin:'25px', overflow:'hidden'}}>
                                    <Stack gap='5px' height='100%' justifyContent='space-between'>
                                        <Typography textTransform='capitalize' variant='h4'>#{application.id}</Typography>
                                        <Stack>
                                            <Typography textTransform='capitalize' variant='subtitle4'>{application.fullName}</Typography>
                                            <Typography variant='subtitle4'>{application.email}</Typography>
                                            <Typography variant='subtitle4'>+{application.countryCode} {application.phoneNumber}</Typography>
                                        </Stack>
                                        <Box display='flex' justifyContent='space-between' gap='10px' marginTop='10px'>
                                            <Button sx={{height:'35px', width:'70px'}} variant='green'><DoneIcon sx={{fontSize:'30px'}}/></Button>
                                            <Button sx={{height:'35px', width:'70px'}} variant='red'><CloseIcon sx={{fontSize:'30px'}}/></Button>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Box>
    )
}
