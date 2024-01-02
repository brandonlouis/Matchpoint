import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { db } from '../../config/firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditNewsArticle() {
    const location = useLocation()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [bannerImg, setBannerImg] = useState('')

    const [selectedTournamentTitle, setSelectedTournamentTitle] = useState('')
    

    useEffect(() => {
        const getNewsArticle = async () => {
            try {
                const res = await getDoc(doc(db, 'newsArticles', location.state.id))
                const resList = res.data()
                getTournament(resList.tournamentID)

                setTitle(resList.title)
                setContent(resList.content)
            } catch (err) {
                window.location.href = '/'
            }
        }
        const getTournament = async (tID) => {
            try {
                const res = await getDoc(doc(db, 'tournaments', tID))
                const resList = res.data()
                setSelectedTournamentTitle(resList.title)
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticle()
    }, [])

    const saveChanges = async (e) => {
        e.preventDefault()
        try {
            await updateDoc(doc(db, 'newsArticles', location.state.id), {
                title: title,
                content: content
            })

            if (bannerImg) { // If new banner image is uploaded
                await uploadBytes(ref(getStorage(), `newsArticles/${location.state.id}-banner`), bannerImg).then((snapshot) => {
                    getDownloadURL(snapshot.ref).then(function(downloadURL) {
                        updateDoc(doc(db, 'newsArticles', location.state.id), {
                            bannerURL: downloadURL
                        })
                    })
                })
            }

            alert('News Article updated successfully')
            window.location.href = `/ViewNewsArticle?id=${location.state.id}`
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                <Stack width='50%'>
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
                                <Box display='flex' gap='50px' justifyContent='flex-start'>
                                    <Button sx={{width:'250px'}} variant='blue' type='submit'>Save Changes</Button>
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