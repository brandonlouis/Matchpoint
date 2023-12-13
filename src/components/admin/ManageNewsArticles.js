import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { getDoc, getDocs, deleteDoc, doc, collection, query, orderBy } from 'firebase/firestore';

export default function ManageNewsArticles() {
    const [openModal, setOpenModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)

    const [newsArticleList, setNewsArticleList] = useState([])
    const [newsArticleDetails, setNewsArticleDetails] = useState({})
    
    const [searchCriteria, setSearchCriteria] = useState('')


    useEffect(() => { // Handle retrieving tournament list on initial load
        const getNewsArticles = async () => {
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setNewsArticleList(processListDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticles()
    }, [])

    const processDate = (article) => {
        const date = article.date.toDate().toDateString().split(' ').slice(1)
        const description = article.description.replaceAll('\\n', '\n') // TODO: Find a better way to handle new line character

        return {
            ...article,
            date,
            description
        }
    }
    const processListDate = (list) => {
        const updatedNewsArticleList = list.map((newsArticle) => {
            const date = newsArticle.date.toDate().toDateString().split(' ').slice(1)

            return {
                ...newsArticle,
                date
            }
        })
        return updatedNewsArticleList
    }

    const viewNewsArticle = async (id) => { // Handle view record by populating data to modal
        setOpenModal(true)
        try {
            const resList = await getDoc(doc(db, 'newsArticles', id))
            const appendID = resList.data()
            appendID.id = id // Append id to list
            setNewsArticleDetails(processDate(appendID))
        } catch (err) {
            console.error(err)
        }
    }

    const deleteNewsArticle = async (id) => {
        try {
            await deleteDoc(doc(db, 'newsArticles', id))
            alert('News Article deleted successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const searchNewsArticle = async (e) => { // Handle search functionality
        e.preventDefault()
        try {
            if (searchCriteria === '') { // If search criteria is empty, retrieve all records
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setNewsArticleList(processListDate(resList))
            } else {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                const filteredList = resList.filter((newsArticle) => newsArticle.title.toLowerCase().includes(searchCriteria.toLowerCase()) || newsArticle.sport == searchCriteria.toLowerCase())
                setNewsArticleList(processListDate(filteredList))
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
                    <Typography variant='h3'>Manage News Articles</Typography>
                    <Box display='flex'>
                        <form style={{display:'flex'}} onSubmit={searchNewsArticle}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {newsArticleList.map((newsArticle) => (
                        <Grid key={newsArticle.id} item width='350px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{borderRadius:'15px', height:'100%'}} >
                                <CardActionArea onClick={() => viewNewsArticle(newsArticle.id)} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                    <CardContent sx={{padding:'0'}}>
                                        <Stack>
                                            <Box height='200px' width='350px'>
                                                <img width='100%' height='100%' style={{objectFit:'cover'}} src={newsArticle.imgURL}/>
                                            </Box>
                                            <Stack bgcolor='white' height='100%' padding='15px 25px 30px' gap='15px'>
                                                <Box display='flex' justifyContent='space-between'>
                                                    <Typography sx={{textTransform:'uppercase'}} variant='subtitle4'>{newsArticle.sport}</Typography>
                                                    <Typography sx={{textTransform:'uppercase'}}  variant='subtitle4'>{newsArticle.date[0]} {newsArticle.date[1]}, {newsArticle.date[2]}</Typography>
                                                </Box>
                                                <Box display='flex'>
                                                    <Typography className='tripleLineConcat' variant='h4'>{newsArticle.title}</Typography>
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
                    <img width='100%' height='250px' style={{objectFit:'cover', borderRadius:'20px 20px 0 0'}} src={newsArticleDetails.imgURL}/>

                    <Stack padding='20px 40px 40px' gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>News Article Details:</Typography>
                        <table style={{tableLayout:'fixed'}}>
                            <tbody>
                                <tr>
                                    <td width='150px'>
                                        <Typography variant='subtitle2'>Article ID:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{newsArticleDetails.id}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Tournament ID:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{newsArticleDetails.tournamentID}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Title:</Typography>
                                    </td>
                                    <td className='doubleLineConcat'>
                                        <Typography variant='subtitle3'>{newsArticleDetails.title}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Description:</Typography>
                                    </td>
                                    <td className='tripleLineConcat'>
                                        <Typography fontWeight='regular' variant='subtitle3'>{newsArticleDetails.description}</Typography>
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
                                        <Typography variant='subtitle2'>Author:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{newsArticleDetails.author}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Publish Date:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>
                                            {newsArticleDetails.date && newsArticleDetails.date.length === 3 && `${newsArticleDetails.date[0]} ${newsArticleDetails.date[1]}, ${newsArticleDetails.date[2]}` }
                                        </Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Sport:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{newsArticleDetails.sport}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <Button onClick={() => setOpenConfirmation(true)} fullWidth variant='red' sx={{marginTop:'25px'}}>Delete News Article</Button>
                    </Stack>
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    <Typography variant='h5'>Delete News Article</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this news article?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => deleteNewsArticle(newsArticleDetails.id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}
