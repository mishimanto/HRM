import api from './api';
export const operationsService={
 approvals:()=>api.get('/approvals'),act:(id,status,comments)=>api.patch(`/approvals/${id}`,{status,comments}),
 notifications:()=>api.get('/notifications'),readNotification:id=>api.post(`/notifications/${id}/read`),
 exportUrl:type=>`${api.defaults.baseURL}/exports/${type}`,
 importEmployees:file=>{const body=new FormData();body.append('file',file);return api.post('/imports/employees',body);},
 importHistory:()=>api.get('/imports'),
 downloadExport:async type=>{const response=await api.get(`/exports/${type}`,{responseType:'blob'});const url=URL.createObjectURL(response.data);const anchor=document.createElement('a');anchor.href=url;anchor.download=`${type}.csv`;anchor.click();URL.revokeObjectURL(url);},
};
