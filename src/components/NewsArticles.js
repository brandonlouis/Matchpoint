import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Checkbox, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Modal, Select, Stack, TextField, Tooltip, Typography, Zoom } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useMediaQuery } from 'react-responsive';

export default function NewsArticles() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const { user, moreUserInfo } = UserAuth()

    const [newsArticleList, setNewsArticleList] = useState([])
    const [personalizedArticleList, setPersonalizedArticleList] = useState([])
    const [sports, setSports] = useState([])
    const [sportsList, setSportsList] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [filterSearch, setFilterSearch] = useState('')

    const [personalizedFilter, setPersonalizedFilter] = useState(false)

    
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
        const getSports = async () => {
            try {
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data()}))
                setSportsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getNewsArticles()
        getSports()

        user && !user.email.includes('@matchpoint.com') && setPersonalizedFilter(true)
    }, [])

    useEffect(() => { // Handle filtering articles based on filter criteria
        const getNewsArticles = async () => {
            if (personalizedFilter) {
                try {
                    const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(article => moreUserInfo?.sportInterests.includes(article.sport))

                    setNewsArticleList(processDate(resList))
                    setPersonalizedArticleList(processDate(resList))
                } catch (err) {
                    console.error(err)
                }
            } else { // If personalized filter is off, retrieve all articles
                try {
                    const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                    setNewsArticleList(processDate(resList))
                } catch (err) {
                    console.error(err)
                }
            }
        }
        getNewsArticles()
    }, [personalizedFilter, moreUserInfo])

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

    const concatSports = async (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )

        if (value.length > 0) {
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(article => value.includes(article.sport) && article.title.toLowerCase().includes(filterSearch?.toLowerCase()))

                setNewsArticleList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                if (filterSearch === '') {
                    const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                    setNewsArticleList(processDate(resList))
                } else {
                    setNewsArticleList(searchResults)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }

    const searchNewsArticle = async (e) => { // Handle search functionality
        e.preventDefault()
        setSports([])
        setFilterSearch(searchCriteria)
        
        if (personalizedFilter) {
            try {
                const resList = personalizedArticleList.filter(article => article.title.toLowerCase().includes(searchCriteria.toLowerCase()))
                
                setSearchResults(processDate(resList))
                setNewsArticleList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((article) => article.title.toLowerCase().includes(searchCriteria.toLowerCase()))

                setSearchResults(processDate(resList))
                setNewsArticleList(processDate(resList))
            } catch (err) {
                console.error(err)
            }
        }
    }


    return (
        <Box height='100%' width='100%' minHeight='460px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-between' alignItems={!isTablet && 'center'}>
                    {isMobile ? 
                        <Stack width='100%' gap={!user && '15px'}>
                            <Typography variant='h3'>News Articles</Typography>
                            <Box display='flex'>
                                <form style={{display:'flex', width:'100%', paddingTop:'25px'}} onSubmit={searchNewsArticle}>
                                    <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                    <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                                </form>
                            </Box>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title="Filter news articles based on your sport interests" arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                            {!user &&
                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                        </Stack>
                        : isTablet ?
                        <>
                        <Stack>
                            <Typography variant='h3'>News Articles</Typography>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title="Filter news articles based on your sport interests" arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                        </Stack>
                        <Stack gap='15px'>
                            <form style={{display:'flex'}} onSubmit={searchNewsArticle}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                            {!user &&
                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                        </Stack>
                        </>
                        :
                        <>
                        <Typography variant='h3'>News Articles</Typography>
                        <Box display='flex' alignItems='center' gap='25px'>
                            {user && moreUserInfo?.type !== 'admin' &&
                                <FormGroup>
                                    <Tooltip TransitionComponent={Zoom} title='Filter news articles based on your sport interests' arrow>
                                        <FormControlLabel className='personalizedFilterLabel' control={<Checkbox checked={personalizedFilter} onChange={() => setPersonalizedFilter(!personalizedFilter)} />} label="Personalized Filter" />
                                    </Tooltip>
                                </FormGroup>
                            }
                            {!user &&
                                <FormControl className='dropdownList' sx={{width:'175px'}}>
                                    <InputLabel>Filter by Sport</InputLabel>
                                    <Select label='Filter by Sport' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                        {sportsList?.map((sport) => {
                                            return <MenuItem value={sport.name} key={sport.name}>
                                                <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                                <Typography variant='action'>{sport.name}</Typography>
                                            </MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            }
                            <form style={{display:'flex'}} onSubmit={searchNewsArticle}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                        </>
                    }
                </Box>
                <Grid container spacing={4} alignItems='stretch' marginTop='25px'>
                    {newsArticleList.map((newsArticle) => (
                        <Grid key={newsArticle.id} xs={12} sm={6} md={4} item borderRadius='15px'>
                            <Card sx={{borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.2)'}} >
                                <CardActionArea onClick={() => window.location.href = `/ViewNewsArticle?id=${newsArticle.id}`} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
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
    )
}
