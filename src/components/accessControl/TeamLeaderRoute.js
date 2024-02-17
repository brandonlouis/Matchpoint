import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext';
import { getDocs, collection, where, query } from 'firebase/firestore'

const TeamLeaderRoute = ({ children }) => {
    const { user } = UserAuth()
    const [isLeader, setIsLeader] = React.useState(true)

    useEffect(() => {
        const getTeams = async () => { // Retrieve all teams from the database where the user is a leader
            try {
                const data = await getDocs(collection(db, 'teams'))
                const leaderList = data.docs.map((doc) => doc.data().leader)
                setIsLeader(leaderList.includes(user.uid))
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()
    }, [])

    if (!user) { // Check if user is not logged in
        return <Navigate to='/' />
    } else if (!isLeader) { // Check if user is not a team leader
        return <Navigate to='/'/>
    }
    return children
}

export default TeamLeaderRoute;