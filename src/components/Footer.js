import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useMediaQuery } from 'react-responsive'

export default function Footer() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 740px)' })

    return (
        <Box width='100%' bgcolor='#222' display='flex' justifyContent='center' height='100%'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                <Box display='flex' justifyContent='space-evenly' alignItems='center' padding={isMobile ? '80px 0' : '120px 0'}>
                    <a style={{height:'40px'}} href='#'><img height='40px' src={require('../img/icons/facebook.png')}/></a>
                    <img src={require('../img/icons/slash.png')} height='50px' opacity='0'/>
                    <a style={{height:'40px'}} href='#'><img height='40px' src={require('../img/icons/instagram.png')}/></a>
                    <img src={require('../img/icons/slash.png')} height='50px' opacity='0.15'/>
                    <a style={{height:'40px'}} href='#'><img height='40px' src={require('../img/icons/twitter.png')}/></a>
                    <img src={require('../img/icons/slash.png')} height='50px' opacity='0.15'/>
                    <a style={{height:'40px'}} href='#'><img height='40px' src={require('../img/icons/youtube.png')}/></a>
                    <img src={require('../img/icons/slash.png')} height='50px' opacity='0.15'/>
                    <a style={{height:'40px'}} href='#'><img height='40px' src={require('../img/icons/linkedin.png')}/></a>
                </Box>

                {isMobile ? 
                    <Stack alignItems='center' paddingBottom='50px' gap='30px'>
                        <a href='/Tournaments'><Typography variant='footer'>Tournaments</Typography></a>
                        <a href='/NewsArticles'><Typography variant='footer'>News Articles</Typography></a>
                        <a href='#'><Typography variant='footer'>Terms of Use</Typography></a>
                        <a href='#'><Typography variant='footer'>Privacy Policy</Typography></a>
                        <a style={{height:'27px', marginTop:'50px'}} href='/'><img height='27px' src={require('../img/logo/logoFooter.png')}/></a>
                    </Stack>
                    :
                    <Box display='flex' justifyContent='space-between' alignItems='center' paddingBottom='30px'>
                        <Box width='310px' display='flex' gap='30px'>
                            <a href='/Tournaments'><Typography variant='footer'>Tournaments</Typography></a>
                            <a href='/NewsArticles'><Typography variant='footer'>News Articles</Typography></a>
                        </Box>
                        
                        <a style={{height:'27px'}} href='/'><img height='27px' src={require('../img/logo/logoFooter.png')}/></a>

                        <Box width='310px' display='flex' justifyContent='flex-end' gap='30px'>
                            <a href='#'><Typography variant='footer'>Terms of Use</Typography></a>
                            <a href='#'><Typography variant='footer'>Privacy Policy</Typography></a>
                        </Box>
                    </Box>
                }
                
            </Stack>
        </Box>
    )
}
