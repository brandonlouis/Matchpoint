import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const AdminRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user || !user.email.includes('@matchpoint.com')) {
        return <Navigate to='/' />
    }
    return children
}

export default AdminRoute;