import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext';
import { getDocs, collection, query } from 'firebase/firestore'

const NoTeamRoute = ({ children }) => {
    const { user } = UserAuth()
    const [isInTeam, setIsInTeam] = React.useState(false)

    useEffect(() => {
        const getTeams = async () => { // Retrieve all teams from the database where the user is a member
            try {
                const q = query(collection(db, 'teams'))
                const data = await getDocs(q)
                const membersList = data.docs.map((doc) => doc.data().members)
                const concatenatedMembersList = [].concat(...membersList)
                setIsInTeam(concatenatedMembersList.includes(user.uid))
            } catch (err) {
                console.error(err)
            }
        }
        getTeams()
    }, [])

    if (!user) { // Check if user is not logged in
        return <Navigate to='/' />
    } else if (isInTeam) { // Check if user is in a team
        return <Navigate to='/' />
    }
    return children
}

export default NoTeamRoute;