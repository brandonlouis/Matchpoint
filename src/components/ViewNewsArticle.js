import React, { useEffect, useState } from 'react'
import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material'
import { FacebookShareButton, TwitterShareButton } from 'react-share'
import { db } from '../config/firebase';
import { getDoc, getDocs, doc, collection, query, orderBy, limit } from 'firebase/firestore';

export default function ViewNewsArticle() {
    const articleID = new URLSearchParams(window.location.search).get("id")

    const [newsArticleDetails, setNewsArticleDetails] = useState({})
    const [newsArticleList, setNewsArticleList] = useState([])
    const [authorName, setAuthorName] = useState('')

    useEffect(() => {
        const getNewsArticle = async () => {
            try {
                const res = await getDoc(doc(db, 'newsArticles', articleID))
                const resList = res.data()
                setNewsArticleDetails(processDate(resList))
                getAuthorName(resList.author)
            } catch (err) {
                console.error(err)
            }
        }
        const getNewsArticles = async () => {
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc'), limit(3)) // Order list by date in descending order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(doc => doc.id !== articleID) // Filter out the current news article
                setNewsArticleList(processListDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        const getAuthorName = async (author) => {
            try {
                const res = await getDoc(doc(db, 'accounts', author))
                const resList = res.data()
                setAuthorName(resList.fullName)
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticle()
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

    const viewNewsArticle=(id)=>{
        window.location.href = `/ViewNewsArticle?id=${id}`;
    }


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='65%' gap='20px'>
                <img src={newsArticleDetails.bannerURL}/>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Stack gap='50px' width='100%'>
                        <Stack gap='15px'>
                            <Typography variant='h2'>{newsArticleDetails.title}</Typography>
                            <Box display='flex' justifyContent='space-between' alignItems='center'>
                                <Typography color='#666' fontWeight='600' variant='subtitle2'>
                                    {authorName}&nbsp;&nbsp;|&nbsp;&nbsp;  {newsArticleDetails.date && newsArticleDetails.date.length === 3 &&
                                    `${newsArticleDetails.date[0]} ${newsArticleDetails.date[1]}, ${newsArticleDetails.date[2]}`
                                    }&nbsp;&nbsp;|&nbsp;&nbsp;
                                    {newsArticleDetails.sport}
                                </Typography>
                                <Box display='flex' alignItems='center' gap='10px'>
                                    <Typography color='#666' fontWeight='600' variant='subtitle2'>Share:</Typography>
                                    <FacebookShareButton className='fbShareButton' url={window.location.href}><img width='25px' src={require('../img/icons/fbShare.png')}/></FacebookShareButton>
                                    <TwitterShareButton className='twitterShareButton' url={window.location.href}><img width='25px' src={require('../img/icons/twitterShare.png')}/></TwitterShareButton>
                                </Box>
                            </Box>
                        </Stack>
                        <Typography sx={{whiteSpace:'pre-line'}} variant='body1'>{newsArticleDetails.content}</Typography>
                        <Stack marginTop='100px' gap='35px'>
                            <hr width='100%'/>
                            <Typography variant='h3'>More Articles</Typography>

                            <Grid container gap='35px' alignItems='stretch'>
                                {newsArticleList.map((newsArticle) => (
                                    <Grid key={newsArticle.id} item width='350px' height='100%' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                        <Card sx={{textAlign:'center', borderRadius:'15px', height:'100%'}} >
                                            <CardActionArea onClick={() => viewNewsArticle(newsArticle.id)}>
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
                                                                <Typography className='tripleLineConcat' textAlign='left' variant='h4'>{newsArticle.title}</Typography>
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
                    </Stack>
                </Box>
            </Stack>
        </Box>
    )
}
