import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { db } from '../../config/firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useMediaQuery } from 'react-responsive';

export default function EditNewsArticle() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const location = useLocation()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [bannerImg, setBannerImg] = useState('')

    const [selectedTournamentTitle, setSelectedTournamentTitle] = useState('')
    

    useEffect(() => { // Retrieve news article details from the database on page load
        const getNewsArticle = async () => { // Retrieve news article details from the database
            try {
                const res = await getDoc(doc(db, 'newsArticles', location.state.id)) // Retrieve news article details from the database using the id from the URL
                const resList = res.data()
                getTournament(resList.tournamentID) // Retrieve tournament details from the database using the tournamentID from the news article details

                setTitle(resList.title)
                setContent(resList.content)
            } catch (err) {
                window.location.href = '/'
            }
        }
        const getTournament = async (tID) => { // Retrieve tournament details from the database
            try {
                const res = await getDoc(doc(db, 'tournaments', tID)) // Retrieve tournament details from the database using the tournamentID from the news article details
                const resList = res.data()
                setSelectedTournamentTitle(resList.title)
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticle()
    }, [])

    const saveChanges = async (e) => { // Save changes to the news article
        e.preventDefault() // Prevent page from refreshing
        try {
            await updateDoc(doc(db, 'newsArticles', location.state.id), { // Update news article details in the database using the id from the URL
                title: title,
                content: content
            })

            if (bannerImg) { // If new banner image is uploaded
                await uploadBytes(ref(getStorage(), `newsArticles/${location.state.id}-banner`), bannerImg).then((snapshot) => { // Upload new banner image to the database
                    getDownloadURL(snapshot.ref).then(function(downloadURL) { // Retrieve the URL of the new banner image
                        updateDoc(doc(db, 'newsArticles', location.state.id), { // Update the banner image URL in the database
                            bannerURL: downloadURL
                        })
                        alert('News Article updated successfully')
                        window.location.href = `/ViewNewsArticle?id=${location.state.id}`
                    })
                })
            } else {
                alert('News Article updated successfully')
                window.location.href = `/ViewNewsArticle?id=${location.state.id}`
            }
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Box width={isMobile || isTablet ? '90%' : '80%'} display='flex' gap='100px'>
                <Stack width='100%'>
                    <Box display='flex' alignContent='center'>
                        <Typography variant='h3'>Edit News Article</Typography>
                    </Box>
                    <form style={{marginTop:'50px'}} onSubmit={saveChanges}>
                        <Stack gap='25px'>
                            <Stack>
                                <Typography variant='subtitle2' textTransform='capitalize'>About Tournament:</Typography>
                                <Typography variant='action' fontSize='18px' textTransform='unset'>{selectedTournamentTitle}</Typography>
                            </Stack>
                            <TextField value={title} onChange={(e) => setTitle(e.target.value)} className='inputTextField' variant='outlined' label='Title' multiline rows={2} required/>
                            <TextField value={content} onChange={(e) => setContent(e.target.value)} className='inputTextField' variant='outlined' label='Content' multiline rows={10} required/>
                            <Stack width='fit-content'>
                                <Typography variant='subtitle2' textTransform='capitalize'>New Banner Image</Typography>
                                <input type="file" accept="image/*"  onChange={(e)=>setBannerImg(e.target.files[0])}/>
                            </Stack>
                            <Stack marginTop='25px' gap='5px'>                                
                                <Box display='flex' gap={isMobile ? '20px' : '50px'} justifyContent={isTablet ? 'center' : 'flex-start'}>
                                    <Button sx={{width:(isMobile ? '100%' : '250px')}} variant='blue' type='submit'>Save Changes</Button>
                                    <Button sx={{width:'120px'}} variant='red' onClick={() => window.location.href = `/MyNewsArticles`}>Back</Button>
                                </Box>
                            </Stack>
                        </Stack>
                    </form>
                </Stack>
            </Box>
        </Box>
    )
}