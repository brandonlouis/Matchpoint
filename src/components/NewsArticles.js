import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';


export default function NewsArticles() {
    const [newsArticleList, setNewsArticleList] = useState([])
    const [searchCriteria, setSearchCriteria] = useState('')

    useEffect(() => { // Handle retrieving tournament list on initial load
        const getNewsArticles = async () => {
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setNewsArticleList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticles()
    }, [])

    const processDate = (list) => {
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
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>News Articles</Typography>
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
        </>
    )
}
