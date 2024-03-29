import React, { useEffect, useState } from 'react'
import { Box, Button, Grid, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, FormControl, Select } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDoc, getDocs, doc, collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useMediaQuery } from 'react-responsive';

export default function ViewMatch() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const adjust730 = useMediaQuery({ query: '(max-width: 730px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })
    const adjust470 = useMediaQuery({ query: '(max-width: 470px)' })
    
    const { user } = UserAuth()
    const matchID = new URLSearchParams(window.location.search).get("id")

    const [viewerType, setViewerType] = useState('spectator')
    const [editMode, setEditMode] = useState(false)

    const [anchorElScoresheet, setAnchorElScoresheet] = useState(null)
    const [openFormatDropdownScoresheet, setOpenFormatDropdownScoresheet] = useState(false)
    const [anchorElSchedule, setAnchorElSchedule] = useState(null)
    const [openFormatDropdownSchedule, setOpenFormatDropdownSchedule] = useState(false)

    const [matchList, setMatchList] = useState({})
    const [participantDetails, setParticipantDetails] = useState([])
    const [tournamentDetails, setTournamentDetails] = useState({})

    const [youtubeURL, setYoutubeURL] = useState([])

    const [errorMessage, setErrorMessage] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    
    useEffect(() => { // Handle retrieving tournament list on initial load
        const getTournament = async () => { // Get tournament details
            try {
                const res = await getDoc(doc(db, 'tournaments', matchID)) // Get tournament details by ID
                const resList = { ...res.data(), id: res.id }

                if (resList.host === undefined) { // If tournament does not exist
                    setTournamentDetails({})
                    setIsLoading(false)
                    return
                }

                setTournamentDetails(resList)
                if (user && (user.uid === resList.host || resList.collaborators?.includes(user.uid))) { // If user is host or collaborator
                    setViewerType('host&collab')
                }
            } catch (err) {
                console.error(err)
            }
        }
        const getMatch = async () => { // Get match details
            try {
                const res = await getDoc(doc(db, 'matches', matchID)) // Get match details by ID
                const resList = res.data()

                if (resList === undefined) { // If match does not exist
                    setMatchList({})
                    setIsLoading(false)
                    return
                }

                getParticipants(resList) // Get participants details
                
                Object.entries(resList.round).forEach(([key, value]) => { // Revert display fields of scores and victor
                    const roundTime = value.time.toDate()
            
                    resList.round[key].time = roundTime
                })
                setMatchList(resList)

                if(resList.highlights === undefined) {
                    setYoutubeURL([])
                } else {
                    setYoutubeURL(resList.highlights)
                }

                setIsLoading(false)
            } catch (err) {
                console.error(err)
            }
        }
        const getParticipants = async (list) => { // Get participants details
            try {
                const accQ = query(collection(db, 'accounts'), orderBy('username')) // Retrieve all accounts in alphabetical order
                const accData = await getDocs(accQ)
                const teamQ = query(collection(db, 'teams'), orderBy('handle')) // Retrieve all teams in alphabetical order
                const teamData = await getDocs(teamQ)

                const accList = accData.docs.map((doc) => ({ ...doc.data(), id: doc.id })) // Append ID to each account
                const teamList = teamData.docs.map((doc) => ({ ...doc.data(), id: doc.id })) // Append ID to each team

                const filteredList = [...accList, ...teamList].filter((item) => list.participants?.includes(item.id)) // Filter out participants not in the match
                setParticipantDetails(filteredList)
            } catch (err) {
                console.error(err)
            }
        }
        getTournament()
        getMatch()
    }, [])

    const updateMatchUp = (e) => { // Update match-up
        const [round, match, team] = e.target.name.split(':') // Extract round, match, and team from the name attribute
        const [key, value] = Object.entries(matchList.round[round].match[match])[team]

        const newMatchList = { ...matchList }
        if (e.target.value === '') { // If the participant is removed from the match
            newMatchList.round[round].match[match][key] = {}
            newMatchList.round[round].match[match][2].victor = ''
        } else {
            newMatchList.round[round].match[match][key] = { [e.target.value]: '0' }
        }
        setMatchList(newMatchList)
    }
    const updateScore = (e) => { // Update score
        const [round, match, team] = e.target.id.split(':') // Extract round, match, and team from the id attribute
        const [key, value] = Object.entries(matchList.round[round].match[match])[team]

        const newMatchList = { ...matchList }

        const participantID = Object.keys(newMatchList.round[round].match[match][key])[0] // Get the participant ID
        newMatchList.round[round].match[match][key][participantID] = e.target.value // Update the score

        setMatchList(newMatchList)
    }
    const updateVictor = (e) => { // Update victor
        const [round, match, team] = e.currentTarget.id.split(':') // Extract round, match, and team from the id attribute

        const newMatchList = { ...matchList }
        if (newMatchList.round[round].match[match][2].victor === e.currentTarget.name || (Object.keys(newMatchList.round[round].match[match][0]).length === 0) || (Object.keys(newMatchList.round[round].match[match][1]).length === 0)) { // If the victor is the same as the current victor, or if one of the participants is empty
            newMatchList.round[round].match[match][2].victor = '' // Remove the victor
        } else {
            newMatchList.round[round].match[match][2].victor = e.currentTarget.name // Set the victor
        }

        setMatchList(newMatchList)
    }
    const updateRoundTime = (e) => { // Update round time
        const newMatchList = { ...matchList }
        newMatchList.round[e.target.id].time = new Date(e.target.value) // Update the time
        
        setMatchList(newMatchList)
    }
    const updateMatchHighlights = (e) => { // Update match highlights
        setYoutubeURL(e.target.value.split('\n'))
    }

    function formatDateTime(date) { // Format date and time to be compatible with the input type datetime-local
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        
        return `${year}-${month}-${day}T${hours}:${minutes}` // Return formatted date and time
    }

    const revertChanges = async () => { // Revert changes when the user cancels
        setErrorMessage('')
        try {
            const res = await getDoc(doc(db, 'matches', matchID)) // Get match details by ID
            const resList = res.data()
            Object.entries(resList.round).forEach(([key, value]) => { // Revert display fields of scores and victor
                const roundTime = value.time.toDate()
                resList.round[key].time = roundTime
            })

            setMatchList(resList)
            setYoutubeURL(resList.highlights)
        } catch (err) {
            console.error(err)
        }
    }

    const saveChanges = async () => { // Save changes when the user confirms
        let errorOccured = false

        if (!youtubeURL?.filter(str => str.trim() !== "").every(url => url.includes("www.youtube.com"))) { // Check for invalid youtube URL amidst empty strings
            setErrorMessage('Invalid YouTube URL')
            errorOccured = true
            return
        }
        
        const newMatchList = { ...matchList }

        Object.entries(newMatchList.statistics).forEach(([key, value]) => {
            let wins = 0
            let losses = 0
            let points = 0

            Object.entries(matchList.round).map(([keyRound, valueRound]) => { // To calculate wins, losses, and points for statistic table
                Object.entries(valueRound.match).map(([keyMatch, valueMatch]) => {

                    if ((Object.keys(valueMatch[0]).length !== 0 && Object.keys(valueMatch[1]).length !== 0) && Object.keys(valueMatch[0])[0] === Object.keys(valueMatch[1])[0]) { // If the match-up is against itself if not empty dict
                        setErrorMessage('Invalid match-up. A participant cannot play against themselves')
                        errorOccured = true
                        return
                    }

                    if (valueMatch.some(dict => dict.hasOwnProperty(key))) { // If the participant is in the match
                        if (valueMatch[2].victor === key) { // If the participant is the victor
                            wins += 1
                        } else if (valueMatch[2].victor !== '' && valueMatch[2].victor !== key) { // If the participant is not the victor
                            losses += 1
                        }

                        valueMatch.map((dict) => { // Tally points
                            if (dict.hasOwnProperty(key)) {
                                points += parseInt(dict[key])
                            }
                        })
                    }
                })
            })
            newMatchList.statistics[key].wins = wins
            newMatchList.statistics[key].losses = losses
            newMatchList.statistics[key].points = points
        })

        if (!errorOccured) {
            try {
                await updateDoc(doc(db, 'matches', matchID), { // Update match details by ID
                    round: newMatchList.round,
                    statistics: newMatchList.statistics,                
                    highlights: youtubeURL.map(str => str.trim()).filter(str => str !== ""), // Remove empty strings and whitespace
                })
    
                alert('Score, Matchup and Highlights updated successfully')
                window.location.reload()
            } catch (err) {
                console.error(err)
            }
        }
    }
    
    // Scoresheets
    // Helper function to convert binary string to ArrayBuffer
    const s2ab = (s) => {
        const buf = new ArrayBuffer(s.length)
        const view = new Uint8Array(buf)

        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF
        }

        return buf
    }
    
    // Excel scoresheet
    const generateAndDownloadExcel = () => {            
        const data = [
            ['Rank', 'Participant', 'W/L','Avg Score','Points']          
        ]

        if (matchList.participants !== undefined) {
            const mappedData = Object.entries(matchList.participants).sort((a, b) => {
                const pointsA = parseFloat(matchList.statistics[a[1]].points)
                const pointsB = parseFloat(matchList.statistics[b[1]].points)
                return pointsB - pointsA // Sort in descending order based on points

            }).map((participant, index) => {
                const [key, value] = participant
                let name = ''
                const participantType = participantDetails.find((item) => item.id === value)

                if (participantType) {
                    name = participantType.handle || participantType.username
                }

                const calcAvg = () => {
                    const points = parseFloat(matchList.statistics[value].points)
                    const wins = parseFloat(matchList.statistics[value].wins)
                    const losses = parseFloat(matchList.statistics[value].losses)

                    let ratio = points / (wins + losses)
                    ratio = isNaN(ratio) ? 0 : ratio

                    if (Number.isInteger(ratio)) {
                        return ratio.toFixed(0)
                    } else {
                        return ratio.toFixed(2)
                    }
                }

                return [
                    index + 1, // Rank
                    name, // Participant
                    `${matchList.statistics[value].wins}/${matchList.statistics[value].losses}`, // W/L
                    calcAvg(), // Avg Score
                    matchList.statistics[value].points, // Points
                ]
            })
            data.push(...mappedData)
        }
 
        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        // Use XLSX.write to get the binary string
        const binaryString = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })

        // Convert the binary string to a Blob
        const blob = new Blob([s2ab(binaryString)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        // Save the Blob using file-saver
        saveAs(blob, 'tournament-scoresheet.xlsx')
    }

    // Txt scoresheet
    const generateAndDownloadTextFile = () => {
        // Text array
        const textData = [
            ['Rank', 'Participant', 'W/L', 'Avg Score', 'Points\n']
        ]

        if (matchList.participants !== undefined) {
            const mappedData = Object.entries(matchList.participants)
                .sort((a, b) => {
                    const pointsA = parseFloat(matchList.statistics[a[1]].points)
                    const pointsB = parseFloat(matchList.statistics[b[1]].points)
                    return pointsB - pointsA // Sort in descending order based on points
                })
                .map((participant, index) => {
                    const [key, value] = participant
                    let name = ''
                    const participantType = participantDetails.find((item) => item.id === value)

                    if (participantType) {
                        name = participantType.handle || participantType.username
                    }

                    const calcAvg = () => { // Calculate average score
                        const points = parseFloat(matchList.statistics[value].points)
                        const wins = parseFloat(matchList.statistics[value].wins)
                        const losses = parseFloat(matchList.statistics[value].losses)

                        let ratio = points / (wins + losses)
                        ratio = isNaN(ratio) ? 0 : ratio // If the ratio is NaN, set it to 0

                        if (Number.isInteger(ratio)) { // If the ratio is an integer
                            return ratio.toFixed(0) // Return the ratio with 0 decimal places
                        } else { // If the ratio is not an integer
                            return ratio.toFixed(2) // Return the ratio with 2 decimal places
                        }
                    }

                    // Manually concatenate elements with a comma between each variable
                    return [
                        index + 1, // Rank
                        name, // Participant
                        `${matchList.statistics[value].wins}/${matchList.statistics[value].losses}`, // W/L
                        calcAvg(), // Avg Score
                        matchList.statistics[value].points
                    ].join(',')
                })
            textData.push(...mappedData)
        }

        const formattedTextData = textData.join('\n')
        const blob = new Blob([formattedTextData], { type: 'text/plain' })
        const link = document.createElement('a')

        link.href = URL.createObjectURL(blob)
        link.download = 'tournament-scoresheet.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Schedule
    // Excel schedule
    const generateAndDownloadExcelSche = () => {
        const data = [
            ['Round','Match', 'Datetime', 'Participant'],
        ]
    
        const rounds = matchList.finals || matchList.round
    
        Object.entries(matchList.round).map(([keyRound, valueRound]) => { // To calculate wins, losses, and points
            Object.entries(valueRound.match).map(([keyMatch, valueMatch]) => {
                const rowData = [] // Array to store data for each participant in a single row
                const isLastRound = keyRound === Object.keys(rounds).length.toString() // Check if it's the last round
                const roundLabel = isLastRound ? 'Final' : `Round ${keyRound}`
                rowData.push(roundLabel) // Add Round value to the row
                rowData.push(keyMatch) // Add Match value
    
                // Add datetime value to the row
                const datetimeValue = rounds[keyRound].time.toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })
                rowData.push(datetimeValue)
    
                for (let i = 0; i <= 1; i++) {
                    const participantType = participantDetails.find((item) => item.id === Object.keys(valueMatch[i]).join(''))
                    if (participantType) {
                        rowData.push(participantType.handle || participantType.username)
                    }
                }
                data.push(rowData) // Push the entire row data into the main data array
            })
        })

        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    
        // Use XLSX.write to get the binary string
        const binaryString = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
    
        // Convert the binary string to a Blob
        const blob = new Blob([s2ab(binaryString)], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
    
        // Save the Blob using file-saver
        saveAs(blob, 'tournament-schedule.xlsx')
    }

    // Txt schedule
    const generateAndDownloadTxtSche = () => {
        const data = [
            ['Round', 'Match', 'Datetime', 'Participant'],
        ]
    
        const rounds = matchList.finals || matchList.round
    
        Object.entries(matchList.round).map(([keyRound, valueRound]) => { // To calculate wins, losses, and points
            Object.entries(valueRound.match).map(([keyMatch, valueMatch]) => {
                const rowData = [] // Array to store data for each participant in a single row
                const isLastRound = keyRound === Object.keys(rounds).length.toString() // Check if it's the last round
                const roundLabel = isLastRound ? 'Grand Final' : `Round,${keyRound}`
                rowData.push(roundLabel) // Add Round value to the row
                rowData.push(keyMatch) // Add Match value
    
                // Add datetime value to the row
                const datetimeValue = rounds[keyRound].time.toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })
                rowData.push(datetimeValue)
    
                for (let i = 0; i <= 1; i++) {
                    const participantType = participantDetails.find((item) => item.id === Object.keys(valueMatch[i]).join(''))
                    if (participantType) {
                        rowData.push(participantType.handle || participantType.username)
                    }
                }
    
                data.push(rowData) // Push the entire row data into the main data array
            })
        })
    
       const formattedTextData = data.join('\n')
       const blob = new Blob([formattedTextData], { type: 'text/plain' })
       const link = document.createElement('a')
   
       link.href = URL.createObjectURL(blob)
       link.download = 'tournament-schedule.txt'
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
    }

    const getYoutubeEmbedUrl = (url) => { // Get the embed URL of a YouTube video
        const videoId = url.split('v=')[1]
        return `https://www.youtube.com/embed/${videoId}` // Return the embed URL
    }

    
    return (
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                {Object.keys(tournamentDetails).length === 0 && !isLoading ?
                    <Stack height='500px' width='100%' justifyContent='center' alignItems='center'>
                        <Typography variant='h3' textAlign='center'>Match does not exist</Typography>
                    </Stack>
                    : !isLoading &&
                    <>
                    {adjust730 ?
                        <Stack justifyContent='space-between' gap={adjust470 ? '30px' : '15px'}>
                            <Typography variant='h3'>{viewerType === 'host&collab' ? 'Manage' : 'Match'} Score & Matchup</Typography>
                            {adjust470 ?
                                <Stack gap='20px'>
                                    <Button sx={{width:'100%', height:'30px'}} startIcon={<RefreshIcon/>} variant='red' onClick={() => {window.location.reload()}}>Refresh</Button>

                                    <Button sx={{ width: '100%', height: '30px' }} startIcon={<DownloadIcon />} variant='blue' onClick={(e) => {setAnchorElScoresheet(e.currentTarget); setOpenFormatDropdownScoresheet(true);}}>Scoresheet</Button>
                                    <Menu PaperProps={{ sx: { width: '100%' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}  transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElScoresheet} open={openFormatDropdownScoresheet} onClose={() => {setAnchorElScoresheet(null); setOpenFormatDropdownScoresheet(false);}} disableScrollLock>
                                    <MenuItem onClick={generateAndDownloadExcel}> <Typography variant='navDropdown'>.XLSX</Typography> </MenuItem>
                                    <MenuItem onClick={generateAndDownloadTextFile}> <Typography variant='navDropdown'>.TXT</Typography> </MenuItem>
                                    <MenuItem onClick={() => window.print()}> <Typography variant='navDropdown'>.PDF</Typography></MenuItem>
                                    </Menu>

                                    <Button sx={{width:'100%', height:'30px'}} startIcon={<DownloadIcon/>} variant='blue' onClick={(e) => {setAnchorElSchedule(e.currentTarget);setOpenFormatDropdownSchedule(true);}}>Schedule</Button>
                                    <Menu PaperProps={{ sx: { width: '100%' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElSchedule} open={openFormatDropdownSchedule} onClose={() => {setAnchorElSchedule(null); setOpenFormatDropdownSchedule(false);}} disableScrollLock>
                                        <MenuItem onClick={generateAndDownloadExcelSche}><Typography variant='navDropdown'>.XLSX</Typography></MenuItem>
                                        <MenuItem onClick={generateAndDownloadTxtSche}><Typography variant='navDropdown'>.TXT</Typography></MenuItem>
                                        <MenuItem onClick={() => window.print()}><Typography variant='navDropdown'>.PDF</Typography></MenuItem>  
                                    </Menu>   
                                </Stack>
                                :
                                <Box display='flex' gap='20px'>
                                    <Button sx={{width:'120px', height:'30px'}} startIcon={<RefreshIcon/>} variant='red' onClick={() => {window.location.reload()}}>Refresh</Button>

                                    <Button sx={{ width: '150px', height: '30px' }} startIcon={<DownloadIcon />} variant='blue' onClick={(e) => {setAnchorElScoresheet(e.currentTarget); setOpenFormatDropdownScoresheet(true);}}>Scoresheet</Button>
                                    <Menu PaperProps={{ sx: { width: '150px' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}  transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElScoresheet} open={openFormatDropdownScoresheet} onClose={() => {setAnchorElScoresheet(null); setOpenFormatDropdownScoresheet(false);}} disableScrollLock>
                                    <MenuItem onClick={generateAndDownloadExcel}> <Typography variant='navDropdown'>.XLSX</Typography> </MenuItem>
                                    <MenuItem onClick={generateAndDownloadTextFile}> <Typography variant='navDropdown'>.TXT</Typography> </MenuItem>
                                    <MenuItem onClick={() => window.print()}> <Typography variant='navDropdown'>.PDF</Typography></MenuItem>
                                    </Menu>

                                    <Button sx={{width:'150px', height:'30px'}} startIcon={<DownloadIcon/>} variant='blue' onClick={(e) => {setAnchorElSchedule(e.currentTarget);setOpenFormatDropdownSchedule(true);}}>Schedule</Button>
                                    <Menu PaperProps={{ sx: { width: '150px' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElSchedule} open={openFormatDropdownSchedule} onClose={() => {setAnchorElSchedule(null); setOpenFormatDropdownSchedule(false);}} disableScrollLock>
                                        <MenuItem onClick={generateAndDownloadExcelSche}><Typography variant='navDropdown'>.XLSX</Typography></MenuItem>
                                        <MenuItem onClick={generateAndDownloadTxtSche}><Typography variant='navDropdown'>.TXT</Typography></MenuItem>
                                        <MenuItem onClick={() => window.print()}><Typography variant='navDropdown'>.PDF</Typography></MenuItem>  
                                    </Menu>   
                                </Box>
                            }
                            
                        </Stack>
                        :
                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                            <Typography variant='h3'>{viewerType === 'host&collab' ? 'Manage' : 'Match'} Score & Matchup</Typography>
                            <Box display='flex' gap='20px'>
                                <Button sx={{width:'120px', height:'30px'}} startIcon={<RefreshIcon/>} variant='red' onClick={() => {window.location.reload()}}>Refresh</Button>

                                <Button sx={{ width: '150px', height: '30px' }} startIcon={<DownloadIcon />} variant='blue' onClick={(e) => {setAnchorElScoresheet(e.currentTarget); setOpenFormatDropdownScoresheet(true);}}>Scoresheet</Button>
                                <Menu PaperProps={{ sx: { width: '150px' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}  transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElScoresheet} open={openFormatDropdownScoresheet} onClose={() => {setAnchorElScoresheet(null); setOpenFormatDropdownScoresheet(false);}} disableScrollLock>
                                <MenuItem onClick={generateAndDownloadExcel}> <Typography variant='navDropdown'>.XLSX</Typography> </MenuItem>
                                <MenuItem onClick={generateAndDownloadTextFile}> <Typography variant='navDropdown'>.TXT</Typography> </MenuItem>
                                <MenuItem onClick={() => window.print()}> <Typography variant='navDropdown'>.PDF</Typography></MenuItem>
                                </Menu>

                                <Button sx={{width:'150px', height:'30px'}} startIcon={<DownloadIcon/>} variant='blue' onClick={(e) => {setAnchorElSchedule(e.currentTarget);setOpenFormatDropdownSchedule(true);}}>Schedule</Button>
                                <Menu PaperProps={{ sx: { width: '150px' } }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorEl={anchorElSchedule} open={openFormatDropdownSchedule} onClose={() => {setAnchorElSchedule(null); setOpenFormatDropdownSchedule(false);}} disableScrollLock>
                                    <MenuItem onClick={generateAndDownloadExcelSche}><Typography variant='navDropdown'>.XLSX</Typography></MenuItem>
                                    <MenuItem onClick={generateAndDownloadTxtSche}><Typography variant='navDropdown'>.TXT</Typography></MenuItem>
                                    <MenuItem onClick={() => window.print()}><Typography variant='navDropdown'>.PDF</Typography></MenuItem>  
                                </Menu>   
                            </Box>
                        </Box>
                    }
                    
                    <Stack marginTop='50px'>
                        <Typography color='#CB3E3E' textTransform='uppercase' variant='subtitle1'>Ranking Table</Typography>
                    </Stack>
                    <TableContainer sx={{width:'100%', maxWidth:'500px'}} component={Paper}>
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
                                    const pointsA = parseFloat(matchList.statistics[a[1]]?.points)
                                    const pointsB = parseFloat(matchList.statistics[b[1]]?.points)

                                    return pointsB - pointsA // Sort in descending order based on points
                                })
                                .map((participant, index) => {
                                    if (participant[1] === 'disbanded') { // Exclude disbanded teams from the ranking table
                                        return
                                    }

                                    const [key, value] = participant
                                    let name = ''
                                    let id = ''
                                    const participantType = participantDetails.find((item) => item.id === value)
                                    
                                    if (participantType) {
                                        name = participantType.handle || participantType.username
                                        id = participantType.id
                                    }

                                    const calcAvg = (value) => {
                                        const points = parseFloat(matchList.statistics[value]?.points)
                                        const wins = parseFloat(matchList.statistics[value]?.wins)
                                        const losses = parseFloat(matchList.statistics[value]?.losses)

                                        let ratio = points / (wins + losses)
                                        ratio = isNaN(ratio) ? 0 : ratio

                                        if (wins !== 0 && losses !== 0){
                                            ratio = points/(wins+losses)
                                        }                                
                                        else if (wins === 0 && losses === 0){
                                            ratio = points
                                        }
                                        
                                        if (Number.isInteger(ratio)) {
                                            return ratio.toFixed(0)
                                        } else {
                                            return ratio.toFixed(2)
                                        }
                                    }

                                    return (
                                    <TableRow key={key}>
                                        <TableCell component="th" scope="row">
                                        {index + 1}
                                        </TableCell>
                                        <TableCell style={{maxWidth:'150px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:'600'}}><a href={`/ViewProfile?id=${id}`}>{name}</a></TableCell>
                                        <TableCell>{matchList.statistics[value]?.wins}/{matchList.statistics[value]?.losses}</TableCell>
                                        <TableCell>{calcAvg(value)}</TableCell>
                                        <TableCell>{matchList.statistics[value]?.points}</TableCell>
                                    </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Stack marginTop='100px' gap='50px'>
                        {matchList.round !== undefined && Object.entries(matchList.round).map(([key, value], index, entriesArray) => (
                            <Stack key={key} gap='10px'>
                                <Stack>
                                    <Typography color='#CB3E3E' textTransform='uppercase' variant='subtitle1'>{index === entriesArray.length - 1 ? 'Grand Finals' : `Round ${key}`}</Typography>
                                    {!editMode ?
                                        <Typography marginTop='-5px' textTransform='uppercase' variant='body2'>{`${value.time.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}`}</Typography>
                                        :
                                        <TextField type="datetime-local" id={key} variant='outlined' className='inputTextField' size='small' sx={{width:'250px'}} onChange={updateRoundTime} value={formatDateTime(new Date(value.time))}
                                            InputProps={{
                                                inputProps: {
                                                    min: new Date(new Date(tournamentDetails.date?.start.toDate()).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                                                    max: tournamentDetails.date?.end.toDate().toISOString().slice(0, 16),
                                                },
                                        }} 
                                        required/>
                                    }
                                </Stack>
                                <Grid container columnGap='50px' rowGap='30px' alignItems='stretch'>
                                    {Object.entries(value.match).map(([key2, value2]) => (
                                        <Grid key={key2} item width='250px'>
                                            <Stack gap='5px'>
                                                {Object.keys(JSON.parse(JSON.stringify(value2[0]))).join('') === Object.values(JSON.parse(JSON.stringify(value2[2]))).join('') && Object.values(JSON.parse(JSON.stringify(value2[2]))).join('') !== '' ?
                                                    <Box bgcolor='#EEE' borderRadius='5px' display='flex' gap='10px' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #36C944'}}>
                                                        <Box display='flex' minWidth={editMode ? '65%' : '75%'}>
                                                            {!editMode ?
                                                                <Typography color='#222' variant='body2' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {Object.entries(JSON.parse(JSON.stringify(value2[0]))).map(([key2]) => {
                                                                        const participantType = participantDetails.find((item) => item.id === key2)
                                                                        if (participantType) {
                                                                            return participantType.handle || participantType.username
                                                                        } else {
                                                                            return (key2 === 'disbanded' && "<Team Disbanded>")
                                                                        }
                                                                    }).join('')}
                                                                </Typography>
                                                                :
                                                                <FormControl className='dropdownList' fullWidth>
                                                                    <Select variant='standard' label='Team' name={`${key}:${key2}:0`} value={Object.keys(value2[0]).join('') || ''} onChange={updateMatchUp} required>
                                                                        <MenuItem value="">
                                                                            <Typography>
                                                                            &nbsp;
                                                                            </Typography>
                                                                        </MenuItem>
                                                                        
                                                                        {participantDetails.map((participant) => {
                                                                            return <MenuItem value={participant.id} key={participant.id}><Typography variant='action' textTransform='lowercase'>{participant.handle || participant.username}</Typography></MenuItem>
                                                                        })}
                                                                    </Select>
                                                                </FormControl>
                                                            }
                                                        </Box>
                                                        <Box display='flex' alignItems='center' justifyContent='flex-end' minWidth={editMode ? '35%' : '20%'}>
                                                            {!editMode ?
                                                                <>
                                                                <Typography fontWeight='600' color='#36C944' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value2[0]))).join('')}`}</Typography>
                                                                <EmojiEventsIcon sx={{ color:'#D0AF00', fontSize: '20px', padding: '5px 0px 5px 10px' }} />
                                                                </>
                                                                :
                                                                <>
                                                                <TextField className='matchScoreTextField' type='number' size='small' id={`${key}:${key2}:0`} value={Object.values(value2[0]).join('') || ''} onChange={updateScore} required />
                                                                <Button onClick={updateVictor} name={Object.keys(value2[0]).join('') || ''} id={`${key}:${key2}:0`} sx={{minWidth:'35px', width:'35px', height:'100%', padding:'3px'}}><EmojiEventsIcon sx={{color:'#D0AF00', fontSize:'20px'}}/></Button>
                                                                </>
                                                            }
                                                        </Box>
                                                    </Box>
                                                    :
                                                    <Box bgcolor='#EEE' borderRadius='5px' display='flex' gap='10px' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #222'}}>
                                                        <Box display='flex' minWidth={editMode ? '65%' : '75%'}>
                                                            {!editMode ?
                                                                <Typography color='#222' variant='body2' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                                    {Object.entries(JSON.parse(JSON.stringify(value2[0]))).map(([key2]) => {
                                                                        const participantType = participantDetails.find((item) => item.id === key2)
                                                                        if (participantType) {
                                                                            return participantType.handle || participantType.username
                                                                        } else {
                                                                            return (key2 === 'disbanded' && "<Team Disbanded>")
                                                                        }
                                                                    }).join('')}
                                                                </Typography>
                                                                :
                                                                <FormControl className='dropdownList' fullWidth>
                                                                    <Select variant='standard' label='Team' name={`${key}:${key2}:0`} value={Object.keys(value2[0]).join('') || ''} onChange={updateMatchUp} required>
                                                                        <MenuItem value="">
                                                                            <Typography>
                                                                            &nbsp;
                                                                            </Typography>
                                                                        </MenuItem>

                                                                        {participantDetails.map((participant) => {
                                                                            return <MenuItem value={participant.id} key={participant.id}><Typography variant='action' textTransform='lowercase'>{participant.handle || participant.username}</Typography></MenuItem>
                                                                        })}
                                                                    </Select>
                                                                </FormControl>
                                                            }
                                                        </Box>
                                                        <Box display='flex' alignItems='center' justifyContent='flex-end' minWidth={editMode ? '35%' : '20%'}>
                                                            {!editMode ?
                                                                <>
                                                                <Typography fontWeight='600' color='#888' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value2[0]))).join('')}`}</Typography>
                                                                <EmojiEventsIcon sx={{ color:'#888', fontSize: '20px', padding: '5px 0px 5px 10px' }} />
                                                                </>
                                                                :
                                                                <>
                                                                <TextField className='matchScoreTextField' type='number' size='small' id={`${key}:${key2}:0`} value={Object.values(value2[0]).join('') || ''} onChange={updateScore} required />
                                                                <Button onClick={updateVictor} name={Object.keys(value2[0]).join('') || ''} id={`${key}:${key2}:0`} sx={{minWidth:'35px', width:'35px', height:'100%', padding:'3px'}}><EmojiEventsIcon sx={{color:'#888', fontSize:'20px'}}/></Button>
                                                                </>
                                                            }
                                                        </Box>
                                                    </Box>
                                                }
                                                {Object.keys(JSON.parse(JSON.stringify(value2[1]))).join('') === Object.values(JSON.parse(JSON.stringify(value2[2]))).join('') && Object.values(JSON.parse(JSON.stringify(value2[2]))).join('') !== '' ?
                                                    <Box bgcolor='#EEE' borderRadius='5px' display='flex' gap='10px' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #36C944'}}>
                                                        <Box display='flex' minWidth={editMode ? '65%' : '75%'}>
                                                            {!editMode ?
                                                                <Typography color='#222' variant='body2' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                                    {Object.entries(JSON.parse(JSON.stringify(value2[1]))).map(([key2]) => {
                                                                        const participantType = participantDetails.find((item) => item.id === key2)
                                                                        if (participantType) {
                                                                            return participantType.handle || participantType.username
                                                                        } else {
                                                                            return (key2 === 'disbanded' && "<Team Disbanded>")
                                                                        }
                                                                    }).join('')}
                                                                </Typography>
                                                                :
                                                                <FormControl className='dropdownList' fullWidth>
                                                                    <Select variant='standard' label='Team' name={`${key}:${key2}:1`} value={Object.keys(value2[1]).join('') || ''} onChange={updateMatchUp} required>
                                                                        <MenuItem value="">
                                                                            <Typography>
                                                                            &nbsp;
                                                                            </Typography>
                                                                        </MenuItem>

                                                                        {participantDetails.map((participant) => {
                                                                            return <MenuItem value={participant.id} key={participant.id}><Typography variant='action' textTransform='lowercase'>{participant.handle || participant.username}</Typography></MenuItem>
                                                                        })}
                                                                    </Select>
                                                                </FormControl>
                                                            }
                                                        </Box>
                                                        <Box display='flex' alignItems='center' justifyContent='flex-end' minWidth={editMode ? '35%' : '20%'}>
                                                            {!editMode ?
                                                                <>
                                                                <Typography fontWeight='600' color='#36C944' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value2[1]))).join('')}`}</Typography>
                                                                <EmojiEventsIcon sx={{color:'#D0AF00', fontSize: '20px', padding: '5px 0px 5px 10px'}} />
                                                                </>
                                                                :
                                                                <>
                                                                <TextField className='matchScoreTextField' type='number' size='small' id={`${key}:${key2}:1`} value={Object.values(value2[1]).join('') || ''} onChange={updateScore} required />
                                                                <Button onClick={updateVictor} name={Object.keys(value2[1]).join('') || ''} id={`${key}:${key2}:1`} sx={{minWidth:'35px', width:'35px', height:'100%', padding:'3px'}}><EmojiEventsIcon sx={{color:'#D0AF00', fontSize:'20px'}}/></Button>
                                                                </>
                                                            }
                                                        </Box>
                                                    </Box>
                                                    :
                                                    <Box bgcolor='#EEE' borderRadius='5px' display='flex' gap='10px' justifyContent='space-between' alignItems='center' style={{padding: index === entriesArray.length - 1 ? '10px' : '0 10px', border: index === entriesArray.length - 1 && '1px solid #222'}}>
                                                        <Box display='flex' minWidth={editMode ? '65%' : '75%'}>
                                                            {!editMode ?
                                                                <Typography color='#222' variant='body2' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                                    {Object.entries(JSON.parse(JSON.stringify(value2[1]))).map(([key2]) => {
                                                                        const participantType = participantDetails.find((item) => item.id === key2)
                                                                        if (participantType) {
                                                                            return participantType.handle || participantType.username
                                                                        } else {
                                                                            return (key2 === 'disbanded' && "<Team Disbanded>")
                                                                        }
                                                                    }).join('')}
                                                                </Typography>
                                                                :
                                                                <FormControl className='dropdownList' fullWidth>
                                                                    <Select variant='standard' label='Team' name={`${key}:${key2}:1`} value={Object.keys(value2[1]).join('') || ''} onChange={updateMatchUp} required>
                                                                        <MenuItem value="">
                                                                            <Typography>
                                                                            &nbsp;
                                                                            </Typography>
                                                                        </MenuItem>

                                                                        {participantDetails.map((participant) => {
                                                                            return <MenuItem value={participant.id} key={participant.id}><Typography variant='action' textTransform='lowercase'>{participant.handle || participant.username}</Typography></MenuItem>
                                                                        })}
                                                                    </Select>
                                                                </FormControl>
                                                            }
                                                        </Box>
                                                        <Box display='flex' alignItems='center' justifyContent='flex-end' minWidth={editMode ? '35%' : '20%'}>
                                                            {!editMode ?
                                                                <>
                                                                <Typography fontWeight='600' color='#888' variant='body2'>{`${Object.values(JSON.parse(JSON.stringify(value2[1]))).join('')}`}</Typography>
                                                                <EmojiEventsIcon sx={{color:'#888', fontSize: '20px', padding: '5px 0px 5px 10px'}} />
                                                                </>
                                                                :
                                                                <>
                                                                <TextField className='matchScoreTextField' type='number' size='small' id={`${key}:${key2}:1`} value={Object.values(value2[1]).join('') || ''} onChange={updateScore} required />
                                                                <Button onClick={updateVictor} name={Object.keys(value2[1]).join('') || ''} id={`${key}:${key2}:1`} sx={{minWidth:'35px', width:'35px', height:'100%', padding:'3px'}}><EmojiEventsIcon sx={{color:'#888', fontSize:'20px'}}/></Button>
                                                                </>
                                                            }
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

                    <Stack marginTop='50px' gap='20px'>
                        <Typography variant='h3'>Match Highlights</Typography>   
                        {editMode && (
                            <TextField value={youtubeURL ? youtubeURL.join('\n') : ''} onChange={updateMatchHighlights} type='text' className='inputTextField' variant='outlined' label='Enter Youtube URL, separated by new line' multiline rows={10} required />                     
                        )}
                        {(youtubeURL?.length > 0 && youtubeURL?.filter(url => url.includes("www.youtube.com"))) ? 
                            (
                                <Grid container spacing={4} alignItems='stretch'>
                                    {youtubeURL?.filter(url => url.trim() !== '' && url.includes("www.youtube.com")).map((url, index) => (
                                        <Grid key={index} xs={12} md={6} item>
                                            <iframe title={`YouTube Video ${index + 1}`} width="100%" height="320" src={getYoutubeEmbedUrl(url)} allow="autoplay; encrypted-media" allowFullScreen />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box display='flex' justifyContent='center' alignItems='center' height='150px'>
                                    <Typography variant='body1'>No highlights uploaded</Typography>
                                </Box>
                            )
                        }
                    </Stack>

                    <Stack alignItems='center' marginTop='75px'>
                        {viewerType === 'host&collab' ?
                            (!editMode ?
                                <Button sx={{width:'350px'}} variant='blue' onClick={() => setEditMode(true)}>Edit Score, Matchup and Highlights</Button>
                                :
                                <Stack>
                                    <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>
                                    <Box display='flex' gap={isTablet ? '20px' : '50px'} width='100%' justifyContent='center'>
                                        <Button sx={{width:(isMobile ? '100%' : '300px')}} variant='blue' onClick={() => saveChanges()}>Save Changes</Button>
                                        <Button sx={{width:(isMobile ? '50%' : '150px')}} variant='red' onClick={() => {setEditMode(false); revertChanges()}}>Back</Button>
                                    </Box>
                                </Stack>
                                
                            )
                            :
                            <Button sx={{width:'300px'}} variant='red' onClick={() => {window.location.href = `/ViewTournament?id=${matchID}`}}>Back</Button>
                        }
                    </Stack>
                    </>
                }
            </Stack>
        </Box>
    )
}