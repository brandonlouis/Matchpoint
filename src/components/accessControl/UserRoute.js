import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const UserRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user) {
        return <Navigate to='/' />
    }
    return children
}

export default UserRoute;