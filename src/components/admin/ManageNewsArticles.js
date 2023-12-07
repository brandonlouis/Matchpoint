import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { getDoc, getDocs, doc, collection, query, orderBy } from 'firebase/firestore';

export default function ManageNewsArticles() {
    const [openModal, setOpenModal] = useState(false)

    const [newsArticleList, setNewsArticleList] = useState([])
    const [newsArticleDetails, setNewsArticleDetails] = useState({})
    
    const [searchCriteria, setSearchCriteria] = useState('')

    // TODO: Handle search and delete functionality

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


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Manage News Articles</Typography>
                    <Box display='flex'>
                        <TextField className='searchTextField' placeholder='SEARCH'/>
                        <Button variant='search'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {newsArticleList.map((newsArticle) => (
                        <Grid key={newsArticle.id} item width='350px' height='100%' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{borderRadius:'15px', height:'100%'}} >
                                <CardActionArea onClick={() => viewNewsArticle(newsArticle.id)}>
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
                                                    <Typography className='multilineConcat' variant='h4'>{newsArticle.title}</Typography>
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
                                    <td width='130px'>
                                        <Typography variant='subtitle2'>ID:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{newsArticleDetails.id}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Title:</Typography>
                                    </td>
                                    <td className='multilineConcat'>
                                        <Typography variant='subtitle3'>{newsArticleDetails.title}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign:'top'}}>
                                        <Typography variant='subtitle2'>Description:</Typography>
                                    </td>
                                    <td className='multilineConcat'>
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
                        <Button fullWidth variant='red' sx={{marginTop:'25px'}}>Delete News Article</Button>
                    </Stack>
                </Stack>
            </Box>
        </Modal>
        </>
    )
}
