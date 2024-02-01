import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { getDoc, getDocs, deleteDoc, doc, collection, query, orderBy } from 'firebase/firestore';
import { ref, getStorage, deleteObject } from 'firebase/storage';
import { useMediaQuery } from 'react-responsive';

export default function MyNewsArticles() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust730 = useMediaQuery({ query: '(max-width: 730px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const { user } = UserAuth()
    const navigate = useNavigate()

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
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((newsArticle) => newsArticle.author === user.uid) // Filter list by author
                
                setNewsArticleList(processListDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticles()
    }, [])

    const processDate = (article) => {
        const date = article.date.toDate().toDateString().split(' ').slice(1)

        return {
            ...article,
            date
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
            await deleteObject(ref(getStorage(), `newsArticles/${id}-banner`))
            alert('News Article deleted successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const searchNewsArticle = async (e) => { // Handle search functionality
        e.preventDefault()
        try {
            const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc'))
            const data = await getDocs(q)
            const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((newsArticle) => newsArticle.author === user.uid) // Filter list by author
            const filteredList = resList.filter((newsArticle) => newsArticle.title.toLowerCase().includes(searchCriteria.toLowerCase()) || newsArticle.sport == searchCriteria.toLowerCase()) // Filter list by search criteria
            
            setNewsArticleList(processListDate(filteredList))
        } catch (err) {
            console.error(err)
        }
    }

    const editNewsArticle= (param) =>{
        navigate('/EditNewsArticle', {state:{id:param}}) // Handle navigation while passing ID as hidden parameter
    }


    return (
        <>
        <Box height='100%' width='100%' minHeight='460px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    {adjust730 ?
                        <Stack width='100%' gap='25px'>
                            <Box display='flex' justifyContent='space-between' alignItems='center'>
                                <Typography variant='h3'>My News Articles</Typography>
                                <Button style={{ height: '45px', width: '65px' }} variant='green' onClick={() => {user.emailVerified ? window.location.href = '/WriteNewsArticle' : alert("Please verify your account before writing a news article")}}> <img src={require('../../img/icons/writeArticle.png')} width='30px' alt="Write Article" /> </Button>
                            </Box>
                            <form style={{display:'flex'}} onSubmit={searchNewsArticle}>
                                <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Stack>
                        :
                        <>
                        <Typography variant='h3'>My News Articles</Typography>
                        <Box display='flex' gap='15px'>
                            <Button style={{ height: '45px', width: '65px' }} variant='green' onClick={() => {user.emailVerified ? window.location.href = '/WriteNewsArticle' : alert("Please verify your account before writing a news article")}}> <img src={require('../../img/icons/writeArticle.png')} width='30px' alt="Write Article" /> </Button>
                            <form style={{display:'flex'}} onSubmit={searchNewsArticle}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                        </>
                    }
                    
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {newsArticleList.map((newsArticle) => (
                        <Grid key={newsArticle.id} item width='350px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{borderRadius:'15px', height:'100%'}} >
                                <CardActionArea onClick={() => viewNewsArticle(newsArticle.id)} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                    <CardContent sx={{padding:'0'}}>
                                        <Stack>
                                            <Box height='200px' width='350px'>
                                                <img width='100%' height='100%' style={{objectFit:'cover'}} src={newsArticle.bannerURL}/>
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
            <Box className='ModalView' display='flex' borderRadius='20px' width='90%' maxWidth='700px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%'>
                    <img width='100%' height='250px' style={{objectFit:'cover', borderRadius:'20px 20px 0 0'}} src={newsArticleDetails.bannerURL}/>

                    <Stack padding='20px 40px 40px' gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>News Article Details:</Typography>
                        <table style={{tableLayout:'fixed'}}>
                            <tbody>
                                <tr>
                                    <td width={isMobile ? '130px' : '150px'}>
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
                                    <td>
                                        <Typography variant='subtitle2'>Title:</Typography>
                                    </td>
                                    <td className='doubleLineConcat'>
                                        <Typography variant='subtitle3'>{newsArticleDetails.title}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Content:</Typography>
                                    </td>
                                    <td className='tripleLineConcat'>
                                        <Typography fontWeight='regular' variant='subtitle3'>{newsArticleDetails.content}</Typography>
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
                        <Box display='flex' justifyContent='space-between' marginTop='25px' gap={isTablet ? '20px' : '50px'}>
                            <Button onClick={() => editNewsArticle(newsArticleDetails.id)} fullWidth variant='blue'>Edit News Article</Button>
                            <Button onClick={() => setOpenConfirmation(true)} fullWidth variant='red'>Delete News Article</Button>
                        </Box>
                    </Stack>
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Delete News Article
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