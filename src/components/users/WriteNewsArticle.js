import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { addDoc, getDocs, collection, updateDoc, query, where} from 'firebase/firestore';
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useMediaQuery } from 'react-responsive';

export default function WriteNewsArticle() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

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


    useEffect(() => { // On page load
        const getTournaments = async () => {
            try {
                const q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid)) // Get tournaments where current user is a collaborator
                const res = await getDocs(q)
                const resList = res.docs.map((doc) => ({...doc.data(), id: doc.id})) // Append id to the tournament data
                setTournamentList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
    }, [])


    const searchTournament = async (e) => { // Handle search tournament function
        e.preventDefault() // Prevent page refresh
        try {
            const q = query(collection(db, 'tournaments'), where('collaborators', 'array-contains', user.uid)) // Get tournaments where current user is a collaborator
            const res = await getDocs(q)
            const resList = res.docs.map((doc) => ({...doc.data(), id: doc.id})) // Append id to the tournament data
            const filteredList = resList.filter((tournament) => tournament.title.toLowerCase().includes(searchCriteria.toLowerCase())) // Filter the tournament list based on the search criteria
            setTournamentList(filteredList)
        } catch (err) {
            console.error(err)
        }
    }

    const publishArticle = async (e) => { // Handle publish article function
        e.preventDefault()
        if (selectedTournamentID !== '') { // If a tournament the article is about is selected
            try {
                const docRef = await addDoc(collection(db, 'newsArticles'), { // Add the news article to the database
                    title: title,
                    content: content,
                    date: new Date(),
                    author: user.uid,
                    tournamentID: selectedTournamentID,
                    sport: selectedTournamentSport,
                    bannerURL: '',
                })

                const snapshot = await uploadBytes(ref(getStorage(), `newsArticles/${docRef.id}-banner`), bannerImg) // Upload the banner image to the storage
                const downloadURL = await getDownloadURL(snapshot.ref) // Get the download URL of the uploaded image
              
                await updateDoc(docRef, { // Update the news article with the banner image URL
                    bannerURL: downloadURL
                })

                alert('News Article successfully published')
                window.location.href = `/ViewNewsArticle?id=${docRef.id}`
            } catch (err) {
                console.error(err)
            }
        } else { // If no tournament is selected
            setErrorMessage('Please select a tournament')
        }
    }


    return (
        <>
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Box width={isMobile || isTablet ? '90%' : '80%'} display='flex' gap='100px'>
                <Stack width='100%'>
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

                                <Box display='flex' gap={isMobile ? '20px' : '50px'} justifyContent={isTablet ? 'center' : 'flex-start'}>
                                    <Button sx={{width:(isMobile ? '100%' : '250px')}} variant='blue' type='submit'>Publish</Button>
                                    <Button sx={{width:'120px'}} variant='red' onClick={() => window.location.href = `/MyNewsArticles`}>Back</Button>
                                </Box>
                            </Stack>
                        </Stack>
                    </form>
                </Stack>
            </Box>
        </Box>
        
        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='80%' maxWidth='815px' maxHeight='600px' padding={isMobile ? '20px' : '50px'} margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='30px'>
                    <Box display='flex' width='100%' justifyContent='center'>
                        <form style={{display:'flex', width:'100%', maxWidth:'450px'}} onSubmit={searchTournament}>
                            <TextField className='searchTextField' value={searchCriteria} placeholder='SEARCH TOURNAMENT' onChange={(e) => setSearchCriteria(e.target.value)} sx={{width:'100% !important'}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                    <Grid container spacing={4} padding='10px' alignItems='stretch' maxHeight='500px' sx={{overflowY:'auto'}}>
                        {tournamentList.length === 0 &&
                            <Stack justifyContent='center' width='100%' paddingTop='25px'>
                                <Typography variant='subtitle2' textAlign='center'>No results found</Typography>
                                <Typography variant='subtitle4' fontSize='15px' textAlign='center'>Note: You must be a collaborator of the Tournament</Typography>
                            </Stack>
                        }
                        {tournamentList.map((tournament) => (
                            <Grid key={tournament.id} xs={12} sm={6} md={4} item borderRadius='15px'>
                                <Card sx={{bgcolor:'white', borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.15)'}} >
                                    <CardActionArea onClick={() => {setSelectedTournamentID(tournament.id); setSelectedTournamentTitle(tournament.title); setSelectedTournamentSport(tournament.sport); setOpenViewModal(false)}} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                        <CardContent sx={{padding:'0', width:'100%'}}>
                                            <Stack>
                                                <Box height='180px'>
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