import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext';
import { getDocs, collection, where, query } from 'firebase/firestore'

const TeamLeaderRoute = ({ children }) => {
    const { user } = UserAuth()
    const [isLeader, setIsLeader] = React.useState(true)

    useEffect(() => {
        const getTeams = async () => {
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

    if (!user) {
        return <Navigate to='/' />
    } else if (!isLeader) {
        return <Navigate to='/'/>
    }
    return children
}

export default TeamLeaderRoute;