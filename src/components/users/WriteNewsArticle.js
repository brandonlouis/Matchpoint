import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { addDoc, getDocs, collection, updateDoc, query, where} from 'firebase/firestore';
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function WriteNewsArticle() {
    const { user } = UserAuth()

    const [openViewModal, setOpenViewModal] = useState(false)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [bannerImg, setBannerImg] = useState('')
    const [tournamentList, setTournamentList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    const [selectedTournamentID, setSelectedTournamentID] = useState('')
    const [selectedTournamentTitle, setSelectedTournamentTitle] = useState('')
    const [selectedTournamentSport, setSelectedTournamentSport] = useState('')

    const [errorMessage, setErrorMessage] = useState('')


    useEffect(() => {
        const getTournaments = async () => {
            try {
                const q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid))
                const res = await getDocs(q)
                const resList = res.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setTournamentList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
    }, [])


    const searchTournament = async (e) => {
        e.preventDefault()
        try {
            const q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid))
            const res = await getDocs(q)
            const resList = res.docs.map((doc) => ({...doc.data(), id: doc.id}))
            const filteredList = resList.filter((tournament) => tournament.title.toLowerCase().includes(searchCriteria.toLowerCase()))
            setTournamentList(filteredList)
        } catch (err) {
            console.error(err)
        }
    }

    const publishArticle = async (e) => {
        e.preventDefault()
        if (selectedTournamentID !== '') {
            try {
                const docRef = await addDoc(collection(db, 'newsArticles'), {
                    title: title,
                    content: content,
                    date: new Date(),
                    author: user.uid,
                    tournamentID: selectedTournamentID,
                    sport: selectedTournamentSport,
                    bannerURL: '',
                })
            
                await uploadBytes(ref(getStorage(), `newsArticles/${docRef.id}-banner`), bannerImg).then((snapshot) => {
                    getDownloadURL(snapshot.ref).then(function(downloadURL) {
                        updateDoc(docRef, {
                            bannerURL: downloadURL
                        })
                    })
                })
                alert('News Article successfully published')
                window.location.href = `/ViewNewsArticle?id=${docRef.id}`  
            } catch (err) {
                console.error(err)
            }
        } else {
            setErrorMessage('Please select a tournament')
        }
    }


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                <Stack width='50%'>
                    <Box display='flex' alignContent='center'>
                        <Typography variant='h3'>Write News Article</Typography>
                    </Box>
                    <form style={{marginTop:'50px'}} onSubmit={publishArticle}>
                        <Stack gap='25px'>
                            <Stack width='fit-content' gap={selectedTournamentID ? '10px' : '0'}>
                                <Stack>
                                    <Typography variant='subtitle2' textTransform='capitalize'>Selected Tournament:</Typography>
                                    <Typography variant='action' fontSize='18px' textTransform='unset'>{selectedTournamentTitle}</Typography>
                                </Stack>
                                <Button onClick={() => {setOpenViewModal(true)}} variant='blue' sx={{height:'30px'}}>View Tournament List</Button>
                            </Stack>
                            <TextField value={title} onChange={(e) => setTitle(e.target.value)} className='inputTextField' variant='outlined' label='Title' multiline rows={2} required/>
                            <TextField value={content} onChange={(e) => setContent(e.target.value)} className='inputTextField' variant='outlined' label='Content' multiline rows={10} required/>
                            <Stack width='fit-content'>
                                <Typography variant='subtitle2' textTransform='capitalize'>Banner Image</Typography>
                                <input type="file" accept="image/*"  onChange={(e)=>setBannerImg(e.target.files[0])} required/>
                            </Stack>
                            <Stack marginTop='25px' gap='5px'>
                                <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>

                                <Box display='flex' gap='50px' justifyContent='flex-start'>
                                    <Button sx={{width:'250px'}} variant='blue' type='submit'>Publish</Button>
                                    <Button sx={{width:'120px'}} variant='red' onClick={() => window.location.href = `/MyNewsArticles`}>Back</Button>
                                </Box>
                            </Stack>
                        </Stack>
                    </form>
                </Stack>
            </Box>
        </Box>
        
        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='815px' maxHeight='600px' padding='50px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='30px'>
                    <Box display='flex' width='100%' justifyContent='center'>
                        <form style={{display:'flex', width:'50%'}} onSubmit={searchTournament}>
                            <TextField className='searchTextField' value={searchCriteria} placeholder='SEARCH TOURNAMENT' onChange={(e) => setSearchCriteria(e.target.value)} sx={{width:'100% !important'}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                    <Grid container gap='15px' padding='10px' alignItems='stretch' maxHeight='500px' sx={{overflowY:'auto'}}>
                        {tournamentList.length === 0 &&
                            <Stack justifyContent='center' width='100%'>
                                <Typography variant='subtitle2' textAlign='center'>No results found</Typography>
                                <Typography variant='subtitle4' fontSize='15px' textAlign='center'>Note: You must be a collaborator of the Tournament</Typography>
                            </Stack>
                        }
                        {tournamentList.map((tournament) => (
                            <Grid key={tournament.id} item width='250px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.15)'>
                                <Card sx={{bgcolor:'white', borderRadius:'15px', height:'100%'}} >
                                    <CardActionArea onClick={() => {setSelectedTournamentID(tournament.id); setSelectedTournamentTitle(tournament.title); setSelectedTournamentSport(tournament.sport); setOpenViewModal(false)}} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                        <CardContent sx={{padding:'0'}}>
                                            <Stack>
                                                <Box height='180px' width='250px'>
                                                    <img width='100%' height='100%' style={{objectFit:'cover'}} src={tournament?.imgURL}/>
                                                </Box>
                                                <Stack height='100%' padding='15px 25px 30px' gap='15px'>
                                                    <Box display='flex' justifyContent='space-between'>
                                                        <Typography textTransform='uppercase' variant='subtitle4'>{tournament.sport}</Typography>
                                                    </Box>
                                                    <Box display='flex'>
                                                        <Typography className='doubleLineConcat' variant='h4'>{tournament.title}</Typography>
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
        </Modal>
        </>
    )
}