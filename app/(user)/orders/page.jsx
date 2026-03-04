"use client"

import { useState } from "react"
import api from "@/lib/api"
import { useEffect } from "react"

export default function Orders() {
    const url = process.env.NEXT_PUBLIC_GOLANG_URL
    const [orders, setOrders] = useState([])
    
    const fetchOrders = await api.get(`${url}/api/orders`).then((res) => setOrders(res.data.data)).catch((err) => console.log(err))

    useEffect(() => {
        fetchOrders()
    }, [])


    return (
        //
    )
}