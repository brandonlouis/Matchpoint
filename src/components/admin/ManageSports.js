import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../../config/firebase';
import { getDocs, getDoc, doc, collection, query, orderBy, where, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function ManageSports() {
    const [openViewModal, setOpenViewModal] = useState(false)
    const [openAddModal, setOpenAddModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)

    const [originalName, setOriginalName] = useState('')
    const [sportsList, setSportsList] = useState([])
    const [sportName, setSportName] = useState('')
    const [sportID, setSportID] = useState('')
    const [newSportName, setNewSportName] = useState('')

    const [searchCriteria, setSearchCriteria] = useState('')

    const [editMode, setEditMode] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')


    useEffect(() => { // Handle retrieving account list on initial load
        const getSports = async () => {
            try {
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setSportsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
    },[])

    const viewSport = async (id) => { // Handle view record by populating data to modal
        setOpenViewModal(true)
        try {
            const res = await getDoc(doc(db, 'sports', id))
            const resList = res.data()
            setOriginalName(resList)

            setSportID(id)
            setSportName(resList.name)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleEditMode = () => {
        setEditMode(!editMode)
    }

    const createSport = async (e) => {
        e.preventDefault()
        try {
            const checkSportName = await getDocs(query(collection(db, 'sports'), where('name', '==', newSportName.trim().toLowerCase()))) // Check if sport name already exists
            if (checkSportName.empty === false) {
                setErrorMessage('Sport name already exists')
            } else {
                await addDoc(collection(db, "sports"), {
                    name: newSportName.trim().toLowerCase()
                })
                alert('Sport created successfully')
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const updateSport = async (e) => {
        e.preventDefault()
        try {
            if (sportName.trim().toLowerCase() !== originalName.name) { // If sport name is unchanged
                const checkSportName = await getDocs(query(collection(db, 'sports'), where('name', '==', sportName.trim().toLowerCase()))) // Check if sport name already exists
                if (checkSportName.empty === false) {
                    setErrorMessage('Sport name already exists')
                } else {
                    await updateDoc(doc(db, 'sports', sportID), {
                        name: sportName.trim().toLowerCase()
                    })
                    alert('Sport updated successfully')
                    window.location.reload()
                }
            } else {
                setEditMode(false)
                setOpenViewModal(false)
            }

        } catch (err) {
            console.error(err)
        }
    }

    const deleteSport = async (id) => {
        try {
            await deleteDoc(doc(db, 'sports', id))
            alert('Sport deleted successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const searchSport = async (e) => {
        e.preventDefault()
        try {
            if (searchCriteria === '') { // If search criteria is empty, retrieve all records
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setSportsList(resList)
            } else { // If search criteria is not empty, retrieve accounts that match the search criteria
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(sport => sport.name.includes(searchCriteria.toLowerCase()))
                setSportsList(resList)
            }
        } catch (err) {
            console.error(err)
        }
    }

    
    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Manage Sports</Typography>
                    <Box display='flex' gap='15px'>
                        <Button style={{height:'45px', width:'65px'}} onClick={() => setOpenAddModal(true)} variant='green'><AddIcon sx={{fontSize:'35px'}}/></Button>
                        <form style={{display:'flex'}} onSubmit={searchSport}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='20px' alignItems='stretch' marginTop='50px'>
                    {sportsList.map((sport) => (
                        <Grid key={sport.id} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                <CardActionArea onClick={() => viewSport(sport.id)}>
                                    <CardContent sx={{padding:'10px 20px'}}>
                                        <Typography textTransform='uppercase' variant='subtitle1'>{sport.name}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Box>

        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false); setEditMode(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='300px' padding='30px 0' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                {!editMode ?
                    <Stack gap='20px'>
                        <TextField value={sportName.toUpperCase()} onChange={(e) => setSportName(e.target.value)} className='inputTextField' variant='outlined' label='Sport Name' inputProps={{pattern:'^[^0-9]+$'}} disabled/>
                        <Box display='flex' flexDirection='row' justifyContent='space-between'>
                            <Button onClick={() => toggleEditMode()} sx={{width:'145px'}} variant='blue'>Edit</Button>
                            <Button onClick={() => setOpenConfirmation(true)} sx={{width:'80px'}} variant='red'>Delete</Button>
                        </Box>
                    </Stack>
                    :
                    <form onSubmit={updateSport}>
                        <Stack gap='20px'>
                            <TextField value={sportName.toUpperCase()} onChange={(e) => setSportName(e.target.value)} className='inputTextField' variant='outlined' label='Sport Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                            <Box display='flex' flexDirection='row' justifyContent='space-between'>
                                <Button sx={{width:'145px'}} variant='blue' type='submit'>Save Changes</Button>
                                <Button onClick={() => toggleEditMode()} sx={{width:'80px'}} variant='red'>Back</Button>
                            </Box>
                        </Stack>
                    </form>
                }
            </Box>
        </Modal>

        <Modal open={openAddModal} onClose={() => {setOpenAddModal(false); setErrorMessage('')}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='300px' padding='30px 0' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <form onSubmit={createSport}>
                    <Stack gap='20px'>
                        <Stack>
                            <TextField onChange={(e) => setNewSportName(e.target.value)} className='inputTextField' variant='outlined' label='Sport Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                            <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='loginErrorMsg'>{errorMessage}</Typography></Box>
                        </Stack>
                        <Box display='flex' flexDirection='row' justifyContent='space-between'>
                            <Button sx={{width:'145px'}} variant='green' type='submit'>Create</Button>
                            <Button onClick={() => {setOpenAddModal(false); setErrorMessage('')}} sx={{width:'80px'}} variant='red'>Back</Button>
                        </Box>
                    </Stack>
                </form>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    <Typography variant='h5'>Delete Sport</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this sport?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => deleteSport(sportID)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}
