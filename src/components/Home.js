import React, { useEffect, useState} from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, TextField, Typography } from '@mui/material'
import lightningBG from '../img/backgrounds/lightningBG.png'
import newsletterBG from '../img/backgrounds/newsletterBG.png'
import { db } from '../config/firebase'
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore'
import { useMediaQuery } from 'react-responsive'

export default function Home() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust900 = useMediaQuery({ query: '(max-width: 900px)' })
    const adjust750 = useMediaQuery({ query: '(max-width: 750px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })
    const adjust500 = useMediaQuery({ query: '(max-width: 500px)' })

    const [tournamentList, setTournamentList] = useState([])
    const [newsArticleList, setNewsArticleList] = useState([])

    useEffect(() => { // Handle retrieving tournament and news article list on load
        const getTournaments = async () => {
            try {
                const q = query(collection(db, 'tournaments')) // Retrieve all tournaments
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0 && tournament.date.end.toDate() > new Date()) // Filter out tournaments that have already ended or are cancelled

                const sortedTournamentsList = sortTournaments(resList)

                if (sortedTournamentsList.length === 0) { // If there are no live or upcoming tournaments, display the latest 3 ended tournaments
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(tournament => tournament.status !== 0) // Filter out tournaments that are cancelled
                    const sortedTournamentsList = sortTournaments(resList)

                    setTournamentList(processTournamentDate(sortedTournamentsList))
                    return
                }

                setTournamentList(processTournamentDate(sortedTournamentsList))
            } catch (err) {
                console.error(err)
            }
        }
        const getNewsArticles = async () => { // Retrieve all news articles
            try {
                const q = query(collection(db, 'newsArticles'), orderBy('date', 'desc')) // Order list by date in descending order
                const data = await getDocs(q)
                const articles = data.docs.map((doc) => ({...doc.data(), id: doc.id})) // Append id to each article
        
                // To ensure sports diversity, articles will be grouped by sport and the most diverse set of 4 articles will be selected
                // Group articles by sport
                const groupedArticles = articles.reduce((acc, article) => { // Group articles by sport
                    const sport = article.sport
                    if (!acc[sport]) { // If sport does not exist in accumulator, create a new array
                        acc[sport] = []
                    }
                    acc[sport].push(article) // Append article to sport array
                    return acc
                }, {})
        
                // Get most diverse set of 4 articles
                let diverseArticles = []
                const remainingArticles = Object.values(groupedArticles).flat() // Flatten grouped articles
                while (diverseArticles.length < 4 && remainingArticles.length > 0) { // While there are less than 4 diverse articles and there are remaining articles
                    const nextArticle = remainingArticles.shift()
                    if (!diverseArticles.some(article => article.sport === nextArticle.sport)) { // If the next article's sport is not in the diverse set, add it
                        diverseArticles.push(nextArticle)
                    }
                }

                // If there are less than 4 sports, fill the rest with the latest articles
                if (diverseArticles.length < 4) {
                    const diverseArticleIds = new Set(diverseArticles.map(article => article.id)) // Create a set of diverse article ids
                    const remainingArticles = articles.filter(article => !diverseArticleIds.has(article.id)) // Filter out articles that are already in the diverse set
                    diverseArticles = [...diverseArticles, ...remainingArticles.slice(0, 4 - diverseArticles.length)] // Fill the rest with the latest articles
                }
        
                setNewsArticleList(processArticleDate(diverseArticles))
            } catch (err) {
                console.error(err)
            }
        }
        getTournaments()
        getNewsArticles()
    }, [])

    const sortTournaments = (list) => { // Sort tournaments by live status and date
        return list.sort((a, b) => {
            const now = new Date()
            const aEndDate = new Date(a.date.end.toDate())
            const bEndDate = new Date(b.date.end.toDate())
            const aStartDate = new Date(a.date.start.toDate())
            const bStartDate = new Date(b.date.start.toDate())

            // Check if tournaments are currently live
            const aIsLive = now >= aStartDate && now <= aEndDate
            const bIsLive = now >= bStartDate && now <= bEndDate

            // Sort by live status and end date
            if (aIsLive && bIsLive) {
                return aEndDate - bEndDate // Sort by end date if both are live
            } else if (aIsLive) {
                return -1 // a is live, should come first
            } else if (bIsLive) {
                return // b is live, should come first
            } else if (aStartDate > now && bStartDate > now) {
                return aStartDate - bStartDate // Sort by start date if both are not live
            } else {
                return bStartDate - aStartDate // Sort by start date in descending order
            }
        }).slice(0, 3) // Limit to 3 tournaments
    }

    const processArticleDate = (list) => { // Process article date to be displayed in a more readable format
        const updatedNewsArticleList = list.map((newsArticle) => {
            const date = newsArticle.date.toDate().toDateString().split(' ').slice(1)

            return {
                ...newsArticle,
                date
            }
        })
        return updatedNewsArticleList
    }
    const processTournamentDate = (list) => { // Process tournament date to be displayed in a more readable format
        const updatedTournamentList = list.map((tournament) => {
            const startDate = tournament.date.start.toDate().toDateString().split(' ').slice(1)
            const endDate = tournament.date.end.toDate().toDateString().split(' ').slice(1)

            return { // Append formatted date to tournament object
                ...tournament,
                stringDate: {
                  start: startDate,
                  end: endDate,
                },
            }
        })
        return updatedTournamentList
    }

    const viewTournament=(id)=>{
        window.location.href = `/ViewTournament?id=${id}`
    }
    const viewNewsArticle=(id)=>{
        window.location.href = `/ViewNewsArticle?id=${id}`
    }


    return (
        <Stack height='100%' width='100%'>
            <Box className='disableSelect disablePointerEvents' display='flex' justifyContent={adjust900 ? 'center' : 'flex-end'} height='100%' minHeight='650px' sx={{backgroundImage: `url('${lightningBG}')`, backgroundRepeat: "no-repeat", backgroundPosition: "right top", backgroundAttachment:'fixed'}}>
                {adjust900 ?
                    <Stack justifyContent='center' alignItems='center' paddingTop='120px' overflow='hidden'>
                        <img style={{height:'530px'}} src={require('../img/elements/team.png')}/>
                        
                        <Stack alignItems='center' padding='50px 0' width='90%' gap='10px'>
                            <Typography variant='h1' textAlign='center' fontSize={isMobile && '10vmin'}><span style={{color:'#CB3E3E'}}>One-stop</span> tournament hub</Typography>
                            <Typography variant='body1' textAlign='center'>Streamline event management, captivate players, and elevate your sports gatherings effortlessly with our comprehensive solutions.</Typography>
                        </Stack>
                    </Stack>
                    :
                    <Box display='flex' width={isMobile || isTablet ? '95%' : '90%'}>
                        <Stack width='40%' padding='158px 0' justifyContent='center' gap='10px'>
                            <Typography variant='h1' fontSize={isMobile && '10vmin'}><span style={{color:'#CB3E3E'}}>One-stop</span> tournament hub</Typography>
                            <Typography variant='body1'>Streamline event management, captivate players, and elevate your sports gatherings effortlessly with our comprehensive solutions.</Typography>
                        </Stack>

                        <Box width='60%' display='flex' alignItems='flex-end' overflow='hidden'>
                            <img style={{height:'530px'}} src={require('../img/elements/team.png')}/>
                        </Box>
                    </Box>
                }
            </Box>
            

            <Box className='disableSelect disablePointerEvents' display='flex' justifyContent='center' padding='100px 0' bgcolor='#EEE'>
                <Stack width={isMobile || isTablet ? '90%' : '80%'} alignItems='center' justifyContent='center' gap='100px'>
                    <Stack textAlign='center' width='100%' maxWidth='470px' gap='10px'>
                        <Typography variant='h3'>Why choose us?</Typography>
                        <Typography variant='body1'>We keep things simple and flexible. Host your very own tournaments in under 3 minutes.</Typography>
                    </Stack>

                    {adjust750 ? 
                        <Stack justifyContent='center' alignItems='center' gap='100px'>
                            <Box bgcolor='#CB3E3E' height='60%' width='10px' position='absolute' zIndex='1'></Box>

                            <Box width='80%' height='100%' display='flex' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px' alignItems='center'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutAI.png')}/>
                                    </Box>
                                    <Typography variant='h4' textAlign='center'>Automated Processes</Typography>
                                    <Typography variant='body1' textAlign='center'>Say goodbye to the headaches of managing tournament brackets. We've got you covered every step of the way. It is as easy as 1, 2, 3!</Typography>
                                </Stack>
                            </Box>

                            <Box width='80%' height='100%' display='flex' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px' alignItems='center'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutTrophy.png')}/>
                                    </Box>
                                    <Typography variant='h4' textAlign='center'>Leaderboards and Statistics</Typography>
                                    <Typography variant='body1' textAlign='center'>Track participants' real-time progress with dynamic leaderboards during matches, making monitoring effortless and enhancing the overall experience.</Typography>
                                </Stack>
                            </Box>

                            <Box width='80%' height='100%' display='flex' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px' alignItems='center'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutCustomize.png')}/>
                                    </Box>
                                    <Typography variant='h4' textAlign='center'>Full Customizability</Typography>
                                    <Typography variant='body1' textAlign='center'>Have something special in mind? Everything is fully adjustable, ensuring flexibility and adaptability that suits your unique requirements.</Typography>
                                </Stack>
                            </Box>
                        </Stack>
                        :
                        <Box display='flex' alignItems='center' justifyContent='center'>
                            <Box bgcolor='#CB3E3E' height='10px' width='50%' position='absolute' zIndex='1'></Box>

                            <Box width='30%' height='100%' display='flex' margin='0 2%' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutAI.png')}/>
                                    </Box>
                                    <Typography variant='h4'>Automated Processes</Typography>
                                    <Typography variant='body1'>Say goodbye to the headaches of managing tournament brackets. We've got you covered every step of the way. It is as easy as 1, 2, 3!</Typography>
                                </Stack>
                            </Box>

                            <Box width='30%' height='100%' display='flex' margin='0 2%' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutTrophy.png')}/>
                                    </Box>
                                    <Typography variant='h4'>Leaderboards and Statistics</Typography>
                                    <Typography variant='body1'>Track participants' real-time progress with dynamic leaderboards during matches, making monitoring effortless and enhancing the overall experience.</Typography>
                                </Stack>
                            </Box>

                            <Box width='30%' height='100%' display='flex' margin='0 2%' zIndex='2'>
                                <Stack gap='15px' bgcolor='white' borderRadius='10px' padding='50px 35px 30px'>
                                    <Box width='75px' height='75px' display='flex' alignItems='center' justifyContent='center' bgcolor='#CB3E3E' borderRadius='100px' position='absolute' marginTop='-90px'>
                                        <img height='40px' src={require('../img/icons/aboutCustomize.png')}/>
                                    </Box>
                                    <Typography variant='h4'>Full Customizability</Typography>
                                    <Typography variant='body1'>Have something special in mind? Everything is fully adjustable, ensuring flexibility and adaptability that suits your unique requirements.</Typography>
                                </Stack>
                            </Box>
                        </Box>
                    }
                    
                </Stack>
            </Box>
            
            <Box display='flex' justifyContent='center' padding='130px 0'>
                <Stack width={isMobile || isTablet ? '90%' : '80%'} justifyContent='center'>
                    {adjust500 ?
                        <Stack gap='5px'>
                            <Typography variant='h3'>Tournaments</Typography>
                            <a href='/Tournaments'><Typography color='#006DEE' fontSize='14px' letterSpacing='2px' variant='action'>See More Tournaments</Typography></a>
                        </Stack>
                        :
                        <Box display='flex' justifyContent='space-between' alignContent='center'>
                            <Typography variant='h3'>Tournaments</Typography>
                            <a href='/Tournaments'><Typography color='#006DEE' fontSize='14px' letterSpacing='2px' variant='action'>See More Tournaments</Typography></a>
                        </Box>
                    }
                    <Grid container spacing={4} alignItems='stretch' marginTop='25px'>
                        {tournamentList.map((tournament) => (
                            <Grid key={tournament.id} xs={12} sm={6} md={4} item borderRadius='15px'>
                                <Card sx={{bgcolor:'#EEE', borderRadius:'15px', height:'100%', boxShadow:'0 5px 15px rgba(0, 0, 0, 0.2)'}} >
                                    <CardActionArea onClick={() => viewTournament(tournament.id)} sx={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-start'}}>
                                        <CardContent sx={{padding:'0', width:'100%'}}>
                                            <Stack>
                                                <Box height='180px'>
                                                    <img width='100%' height='100%' style={{objectFit:'cover'}} src={tournament.imgURL}/>
                                                </Box>
                                                <Stack height='100%' padding='15px 25px 30px' gap='15px'>
                                                    <Stack>
                                                        <Box display='flex' justifyContent='space-between'>
                                                            <Typography textTransform='uppercase' variant='subtitle4'>{tournament.sport}</Typography>
                                                            {tournament.stringDate.start[2] === tournament.stringDate.end[2] ? 
                                                                <Typography textTransform='uppercase' variant='subtitle4'>{tournament.stringDate.start[0]} {tournament.stringDate.start[1]} — {tournament.stringDate.end[1]}, {tournament.stringDate.end[2]}</Typography>
                                                                :
                                                                <Typography textTransform='uppercase' variant='subtitle4'>{tournament.stringDate.start[0]} {tournament.stringDate.start[1]}, {tournament.stringDate.start[2]} — {tournament.stringDate.end[0]} {tournament.stringDate.end[1]}, {tournament.stringDate.end[2]}</Typography>
                                                            }
                                                        </Box>
                                                        <Box display='flex' justifyContent='space-between'>
                                                            <Typography textTransform='uppercase' variant='subtitle4'>Region: {tournament.region}</Typography>
                                                            <Typography textTransform='uppercase' variant='subtitle4' maxWidth='150px' overflow='hidden' whiteSpace='nowrap' textOverflow='ellipsis'>Prize: {tournament.prizes.first !== '' ? tournament.prizes.first : "No Prize"}</Typography>
                                                        </Box>
                                                    </Stack>
                                                    
                                                    <Box display='flex'>
                                                        <Typography className='doubleLineConcat' textAlign='left' variant='h4'>
                                                            {tournament.date?.end.toDate() < Date.now() ? (
                                                                <span style={{ color: '#888' }}>ENDED: </span>
                                                            ) : tournament.date?.start.toDate() <= Date.now() && tournament.date?.end.toDate() >= Date.now() ? (
                                                                <span style={{ color: '#CB3E3E' }}>LIVE NOW: </span>
                                                            ) : null}
                                                            {tournament.title}
                                                        </Typography>
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

            <Box display='flex' justifyContent='center' padding='90px 0' bgcolor='#EEE'>
                <Stack width={isMobile || isTablet ? '90%' : '80%'} justifyContent='center'>
                    {adjust500 ?
                        <Stack gap='5px'>
                            <Typography variant='h3'>News Articles</Typography>
                            <a href='/NewsArticles'><Typography color='#006DEE' fontSize='14px' letterSpacing='2px' variant='action'>See More Articles</Typography></a>
                        </Stack>
                        :
                        <Box display='flex' justifyContent='space-between' alignContent='center'>
                            <Typography variant='h3'>News Articles</Typography>
                            <a href='/NewsArticles'><Typography color='#006DEE' fontSize='14px' letterSpacing='2px' variant='action'>See More Articles</Typography></a>
                        </Box>
                    }
                    

                    <Grid container spacing={4} marginTop='25px'>
                        {newsArticleList.map((newsArticle) => (
                            <Grid key={newsArticle.id} xs={12} sm={6} md={3} item borderRadius='15px'>
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
            </Box>

            <Box className='disableSelect disablePointerEvents' display='flex' justifyContent='center' height='150px' sx={{backgroundImage: `url('${newsletterBG}')`, backgroundRepeat:"no-repeat", backgroundSize:'cover'}}>
                <Stack width={isMobile || isTablet ? '90%' : '80%'} alignItems='center' justifyContent='center'>
                    <Typography color='white' variant='h3' textAlign='center'>Join us today!</Typography>
                    <Typography color='white' textAlign='center' variant='body1'>Embark on a seamless journey into tournament hosting, where simplicity meets boundless possibilities.</Typography>
                </Stack>
            </Box>
        </Stack>
    )
}
