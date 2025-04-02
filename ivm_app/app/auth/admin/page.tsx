import React from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';


const Admin = () => {
  return (
    <div>
      <h1>Current Website users</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-bold">4K</TableCell>
            <TableCell>Steven Levis</TableCell>
            <TableCell>steven.levis@gmail.com</TableCell>
            <TableCell>415-625-3847</TableCell>
            <TableCell><Checkbox checked /></TableCell>
            <TableCell className="flex gap-x-2">
              <Button className="bg-blue-600 h-6">Edit</Button>
              <Button variant="destructive" className="h-6">Delete</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-bold">8P</TableCell>
            <TableCell>Another Resident</TableCell>
            <TableCell>aresident@msn.com</TableCell>
            <TableCell>734-555-1212</TableCell>
            <TableCell><Checkbox /></TableCell>
            <TableCell className="flex gap-x-2">
              <Button className="bg-blue-600 h-6">Edit</Button>
              <Button variant="destructive" className="h-6">Delete</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-bold">101</TableCell>
            <TableCell>Some Fakeuser</TableCell>
            <TableCell>s0m3f4k3@aol.com</TableCell>
            <TableCell>867-5390</TableCell>
            <TableCell><Checkbox disabled /></TableCell>
            <TableCell className="flex gap-x-2">
              <Button className="bg-green-700 h-6">Approve</Button>
              <Button variant="destructive" className="h-6">Deny</Button></TableCell>
          </TableRow>
        </TableBody>
      </Table>

    </div>
  )
}

export default Admin