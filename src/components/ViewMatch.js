import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import { db } from '../config/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { WindowSharp } from '@mui/icons-material';

export default function ViewMatch() {
    const matchID = new URLSearchParams(window.location.search).get("id")

    const [anchorEl, setAnchorEl] = useState(null)
    const openFormatDropdown = Boolean(anchorEl)

    const [matchList, setMatchList] = useState({})


    useEffect(() => { // Handle retrieving tournament list on initial load
        const getMatch = async () => {
            try {
                const res = await getDoc(doc(db, 'matches', matchID))
                const resList = res.data()
                setMatchList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getMatch()
    }, [])
    // TODO: Download formats for scoresheet and schedule


    return (
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Match Score & Matchup</Typography>
                    <Box display='flex' gap='20px'>
                        <Button sx={{width:'120px', height:'30px'}} variant='red' onClick={() => {window.location.reload()}}><RefreshIcon sx={{fontSize:'20px', marginRight:'10px'}}/>Refresh</Button>
                        <Button sx={{width:'150px', height:'30px'}} variant='blue' onClick={(e) => {setAnchorEl(e.currentTarget)}}><DownloadIcon sx={{fontSize:'20px', marginRight:'10px'}}/>Scoresheet</Button>
                        <Button sx={{width:'150px', height:'30px'}} variant='blue' onClick={(e) => {setAnchorEl(e.currentTarget)}}><DownloadIcon sx={{fontSize:'20px', marginRight:'10px'}}/>Schedule</Button>

                        <Menu PaperProps={{sx: {width: '150px'}}} anchorOrigin={{vertical: "bottom", horizontal: "right"}} transformOrigin={{vertical: "top",horizontal: "right"}} anchorEl={anchorEl} open={openFormatDropdown} onClose={() => {setAnchorEl(null)}} disableScrollLock>
                                <MenuItem onClick={() => {}}><Typography variant='navDropdown'>.PNG</Typography></MenuItem>
                                <MenuItem onClick={() => {}}><Typography variant='navDropdown'>.JPG</Typography></MenuItem>
                                <MenuItem onClick={() => {}}><Typography variant='navDropdown'>.DOCX</Typography></MenuItem>
                                <MenuItem onClick={() => {}}><Typography variant='navDropdown'>.TXT</Typography></MenuItem>
                                <MenuItem onClick={() => {}}><Typography variant='navDropdown'>.XLSX</Typography></MenuItem>

                            </Menu>
                    </Box>
                </Box>
                <Stack marginTop='50px'>
                    <Typography color='#CB3E3E' textTransform='uppercase' variant='subtitle1'>Ranking Table</Typography>
                </Stack>
                <TableContainer sx={{width:'500px'}} component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography textTransform='capitalize' color='#222' variant='subtitle2'>Rank</Typography></TableCell>
                            <TableCell width='150px'><Typography textTransform='capitalize' color='#222'  variant='subtitle2'>Participant</Typography></TableCell>
                            <TableCell><Typography textTransform='capitalize' color='#222'  variant='subtitle2'>W/L</Typography></TableCell>
                            <TableCell><Typography textTransform='capitalize' color='#222'  variant='subtitle2'>Avg Score</Typography></TableCell>
                            <TableCell><Typography textTransform='capitalize' color='#222'  variant='subtitle2'>Points</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matchList.participants !== undefined && Object.entries(matchList.participants).sort((a, b) => {
                            const pointsA = parseFloat(matchList.statistics[a[1]].points);
                            const pointsB = parseFloat(matchList.statistics[b[1]].points);

                            return pointsB - pointsA; // Sort in descending order based on points
                        })
                        .map((participant, index) => {
                            const [key, value] = participant;

                            const calcAvg = (value) => {
                                const points = parseFloat(matchList.statistics[value].points);
                                const wins = parseFloat(matchList.statistics[value].wins);
                                const losses = parseFloat(matchList.statistics[value].losses);

                                const ratio = points / (wins + losses);

                                if (Number.isInteger(ratio)) {
                                    return ratio.toFixed(0);
                                } else {
                                    return ratio.toFixed(2);
                                }
                            };

                            return (
                            <TableRow key={key}>
                                <TableCell component="th" scope="row">
                                {index + 1}
                                </TableCell>
                                <TableCell>{value}</TableCell>
                                <TableCell>{matchList.statistics[value].wins}/{matchList.statistics[value].losses}</TableCell>
                                <TableCell>{calcAvg(value)}</TableCell>
                                <TableCell>{matchList.statistics[value].points}</TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                </TableContainer>

                <Stack marginTop='100px' gap='50px'>
                    {matchList.round !== undefined && Object.entries(matchList.round).map(([key, value], index, entriesArray) => (
                        <Stack key={key} gap='10px'>
                            <Stack>
                                <Typography color='#CB3E3E' textTransform='uppercase' variant='subtitle1'>{index === entriesArray.length - 1 ? 'Grand Finals' : `Round ${key}`}</Typography>
                                <Typography marginTop='-5px' textTransform='uppercase' variant='body2'>{`${value.time.toDate().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}`}</Typography>
                            </Stack>
                            <Grid container columnGap='50px' rowGap='30px' alignItems='stretch'>
                                {Object.entries(value.match).map(([key, value]) => (
                                    <Grid key={key} item width='250px'>
                                        <Stack gap='5px'>
                                            {Object.keys(JSON.parse(JSON.stringify(value[0]))).join('') === Object.values(JSON.parse(JSON.stringify(value[2]))).join('') ?
                                                <Box bgcolor='#EEE' borderRadius='5px' display='flex' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #36C944'}}>
                                                    <Typography color='#222' lineHeight='1px' variant='body2'>{Object.entries(JSON.parse(JSON.stringify(value[0]))).map(([key]) => `${key}`)}</Typography>
                                                    <Box display='flex' alignItems='center'>
                                                        <Typography fontWeight='600' color='#36C944' lineHeight='1px' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value[0]))).join('')}`}</Typography>
                                                        <EmojiEventsIcon sx={{ color:'#D0AF00', fontSize: '20px', padding: '5px 0px 5px 10px' }} />
                                                    </Box>
                                                </Box>
                                                :
                                                <Box bgcolor='#EEE' borderRadius='5px' display='flex' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #222'}}>
                                                    <Typography color='#222' lineHeight='1px' variant='body2'>{Object.entries(JSON.parse(JSON.stringify(value[0]))).map(([key]) => `${key}`)}</Typography>
                                                    <Box display='flex' alignItems='center'>
                                                        <Typography fontWeight='600' color='#888' lineHeight='1px' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value[0]))).join('')}`}</Typography>
                                                        <EmojiEventsIcon sx={{ color:'#888', fontSize: '20px', padding: '5px 0px 5px 10px' }} />
                                                    </Box>
                                                </Box>
                                            }
                                            {Object.keys(JSON.parse(JSON.stringify(value[1]))).join('') === Object.values(JSON.parse(JSON.stringify(value[2]))).join('') ?
                                                <Box bgcolor='#EEE' borderRadius='5px' display='flex' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #36C944'}}>
                                                    <Typography color='#222' lineHeight='1px' variant='body2'>{Object.entries(JSON.parse(JSON.stringify(value[1]))).map(([key]) => `${key}`)}</Typography>
                                                    <Box display='flex' alignItems='center'>
                                                        <Typography fontWeight='600' color='#36C944' lineHeight='1px' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value[1]))).join('')}`}</Typography>
                                                        <EmojiEventsIcon sx={{color:'#D0AF00', fontSize: '20px', padding: '5px 0px 5px 10px'}} />
                                                    </Box>
                                                </Box>
                                                :
                                                <Box bgcolor='#EEE' borderRadius='5px' display='flex' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #222'}}>
                                                    <Typography color='#222' lineHeight='1px' variant='body2'>{Object.entries(JSON.parse(JSON.stringify(value[1]))).map(([key]) => `${key}`)}</Typography>
                                                    <Box display='flex' alignItems='center'>
                                                        <Typography fontWeight='600' color='#888' lineHeight='1px' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value[1]))).join('')}`}</Typography>
                                                        <EmojiEventsIcon sx={{color:'#888', fontSize: '20px', padding: '5px 0px 5px 10px'}} />
                                                    </Box>
                                                </Box>
                                            }
                                        </Stack>
                                    </Grid>
                                ))}
                            </Grid>
                        </Stack>
                    ))}
                </Stack>
                <Box display='flex' justifyContent='center' marginTop='75px'>
                    <Button sx={{width:'300px'}} variant='red' onClick={() => {window.location.href = `/ViewTournament?id=${matchID}`}}>Back</Button>
                </Box>
            </Stack>
        </Box>
    )
}
