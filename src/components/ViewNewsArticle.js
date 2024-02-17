import React, { useEffect, useState } from 'react'
import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material'
import { FacebookShareButton, TwitterShareButton } from 'react-share'
import { db } from '../config/firebase'
import { getDoc, getDocs, doc, collection, query, orderBy, limit } from 'firebase/firestore'
import { useMediaQuery } from 'react-responsive'

export default function ViewNewsArticle() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust750 = useMediaQuery({ query: '(max-width: 750px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const articleID = new URLSearchParams(window.location.search).get("id")

    const [isLoading, setIsLoading] = useState(true)

    const [newsArticleDetails, setNewsArticleDetails] = useState({})
    const [newsArticleList, setNewsArticleList] = useState([])
    const [authorName, setAuthorName] = useState('')
    const [tournamentID, setTournamentID] = useState('')
    
    useEffect(() => { // On page load
        const getNewsArticle = async () => { // Get news article details
            try {
                const res = await getDoc(doc(db, 'newsArticles', articleID)) // Get news article details by ID
                const resList = res.data()

                if (resList === undefined) { // If news article does not exist
                    setNewsArticleDetails({}) // Set news article details to empty object
                    setIsLoading(false)
                    return
                }

                setNewsArticleDetails(processDate(resList))
                setTournamentID(resList.tournamentID)
                getAuthorName(resList.author) // Get author name

                setIsLoading(false)
            } catch (err) {
                console.error(err)
            }
        }
        const getNewsArticles = async () => { // Get list of news articles
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(doc => doc.id !== articleID).slice(0, 3) // Filter out the current news article
                setNewsArticleList(processListDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        const getAuthorName = async (author) => { // Get author name
            try {
                const res = await getDoc(doc(db, 'accounts', author)) // Get author details by ID
                const resList = res.data()
                setAuthorName(resList.fullName)
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticle()
        getNewsArticles()
    }, [])
    
    const processDate = (article) => { // Process date to be displayed in a more readable format
        const date = article.date.toDate().toDateString().split(' ').slice(1)

        return { // Append date to article object
            ...article,
            date
        }
    }
    const processListDate = (list) => { // Process date to be displayed in a more readable format for list
        const updatedNewsArticleList = list.map((newsArticle) => {
            const date = newsArticle.date.toDate().toDateString().split(' ').slice(1)

            return { // Append date to article object
                ...newsArticle,
                date
            }
        })
        return updatedNewsArticleList
    }

    const viewNewsArticle=(id)=>{ // Redirect to news article page
        window.location.href = `/ViewNewsArticle?id=${id}` // Append news article ID to URL
    }


    return (
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '80%' : '65%'} gap='20px'>
                {Object.keys(newsArticleDetails).length === 0 && !isLoading ?
                    <Stack height='500px' width='100%' justifyContent='center' alignItems='center'>
                        <Typography variant='h3' textAlign='center'>News Article does not exist</Typography>
                    </Stack>
                    : !isLoading &&
                    <>
                    <img src={newsArticleDetails.bannerURL}/>
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Stack gap='50px' width='100%'>
                            <Stack gap='15px'>
                                <Typography variant='h2'>{newsArticleDetails.title}</Typography>       
                                <a href={`/ViewTournament?id=/${tournamentID}`}><Typography color='#006DEE' fontWeight='600' variant='subtitle2'>View tournament details</Typography> </a>
                                {adjust750 ? 
                                    <Stack gap='10px'>                                    
                                        <Typography color='#666' fontWeight='600' variant='subtitle2'>
                                            {authorName}&nbsp;&nbsp;|&nbsp;&nbsp;  {newsArticleDetails.date && newsArticleDetails.date.length === 3 &&
                                            `${newsArticleDetails.date[0]} ${newsArticleDetails.date[1]}, ${newsArticleDetails.date[2]}`
                                            }&nbsp;&nbsp;|&nbsp;&nbsp;
                                            {newsArticleDetails.sport}
                                        </Typography>
                                        <Box display='flex' alignItems='center' justifyContent='center' gap='10px'>
                                            <FacebookShareButton className='fbShareButton' style={{width:'50%'}} url={window.location.href}><img width='25px' src={require('../img/icons/fbShare.png')}/></FacebookShareButton>
                                            <TwitterShareButton className='twitterShareButton' style={{width:'50%'}} url={window.location.href}><img width='25px' src={require('../img/icons/twitterShare.png')}/></TwitterShareButton>
                                        </Box>
                                    </Stack>
                                    :
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
                                }
                            </Stack>
                            <Typography sx={{whiteSpace:'pre-line'}} variant='body1'>{newsArticleDetails.content}</Typography>
                            <Stack marginTop='100px' gap='35px'>
                                <hr/>
                                <Typography variant='h3'>More Articles</Typography>

                                <Grid container spacing={4} alignItems='stretch'>
                                    {newsArticleList.map((newsArticle) => (
                                        <Grid key={newsArticle.id} xs={12} sm={6} md={4} item borderRadius='15px'>
                                            <Card sx={{borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.2)'}} >
                                                <CardActionArea onClick={() => viewNewsArticle(newsArticle.id)} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                                    <CardContent sx={{padding:'0', width:'100%'}}>
                                                        <Stack>
                                                            <Box height='200px'>
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
                    </>
                }
            </Stack>
        </Box>
    )
}
