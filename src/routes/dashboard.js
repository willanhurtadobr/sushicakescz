const express = require('express');
const router = express.Router();
const pool = require('../database');
const rxjs = require('rxjs');
const { json } = require('express');
const multer = require('multer');
const bodyParser= require('body-parser');
const path = require('path');
const fs = require('fs');
const { isLoggedIn } = require('../lib/auth');
const { session } = require('passport');


const asyncForEach = async (array, callback) => {
   for (let i = 0; i < array.length; i++) {
     await callback(array[i], i, array);
   }
 };


//----------DASHBOARD------PRODUCTOS------------------------------------------------------------>
router.get('/',isLoggedIn, async (req,res)=>{
   const {id_direc} = req.user;
   const puto ={
    id_direc,
   };
   let admin = await pool.query('select productos.precio, productos.nombre,productos.id_produ,productos.descripcion, productos.id_sec, secciones.nombresec, secciones.id_sec, secciones.id_direc from productos, secciones where secciones.id_sec = productos.id_sec and secciones.id_direc = ?',[id_direc] );


   res.render('dashboard/dashboard',{admin});
});


//adicionar---productos-------------------------->
router.get('/newprodu/:id_sec',isLoggedIn,async (req,res)=>{
   const {id_sec}=req.params;
   const selec = await pool.query('select * from secciones where id_sec= ?',[id_sec]);
   res.render('dashboard/newprodu',{selec});
});
router.post('/newprodu',isLoggedIn, async (req,res)=>{
  const {nombre,descripcion,precio,id_sec,porciones} = req.body;
  const addi= {
     nombre,
     descripcion,
     precio,
     porciones,	  
     id_sec,
  };

  await pool.query('insert into productos set ?',[addi]);
  res.redirect('/dashboard/secciones');
});
//editar---producto------------------------------->
router.get('/edit/:id_produ', isLoggedIn,async (req,res)=>{
    const {id_produ} = req.params;
    const editar = await pool.query('select * from productos where id_produ = ?', [id_produ]);
    await asyncForEach(editar, async (sect) => {
      sect.adicionales = await pool.query(`select * from adicionales where id_produ = ${sect.id_produ}`);
    });
    res.render('dashboard/editar',{editar})
});
router.post('/editado/:id_produ',isLoggedIn, async (req,res)=>{
   const { id_produ } = req.params;
   const { nombre, descripcion, precio,} = req.body; 
   const pishoi = {
      nombre,
      descripcion,
      precio,
      
   };
   await pool.query('UPDATE productos set ? WHERE id_produ = ?', [pishoi, id_produ]);

   res.redirect('/dashboard');
});
//eliminar---producto--------------------------->
router.get('/delete/:id_produ', isLoggedIn,async (req,res)=>{
  const {id_produ}= req.params;
  await pool.query('delete from productos where id_produ = ?',[id_produ]);
  req.flash('message','el producto fué eliminado con exito');
  res.redirect('/dashboard');
});
//adicionar-----adicionales--------------------->
router.post('/adicionales/:id_produ', async (req,res)=>{
  const {id_produ}=req.params;
  const {nombreadic,precio}= req.body;
  const adicion={
   nombreadic,
   precio,
   id_produ,
  };
  await pool.query('insert into adicionales set ?', [adicion]);
  req.flash('message', 'opcion agregada correctamente');
  res.redirect('back');
});
//eliminar----adicional---------------------------->
router.get('/deleteadi/:id_adi', async (req,res)=>{
   const {id_adi} = req.params;
   await pool.query('delete from adicionales where id_adi= ?',[id_adi]);
   res.redirect('back');
});

//--------PORCIONES----------------------------------------------------------------------------------->
router.get('/porciones/:id_produ', isLoggedIn, async (req,res)=>{
const {id_produ}=req.params;
req.session.porc= id_produ;
const porci = await  pool.query('select * from porciones where id_produ = ?',[id_produ]);
res.render('dashboard/porciones',{porci});
});

//adicionar---porciones----------------------------->
router.post('/porciones', isLoggedIn, async (req,res)=>{
  const id_produ= req.session.porc;
  const {nombrepor,precio}=req.body;
  const porcions ={
    id_produ,
    nombrepor,
    precio,
  }
  await pool.query('insert into porciones set ? ',[porcions])
  res.redirect('back');
});
//eliminar----porciones------------------------------->
router.get('/deletePor/:id_por', isLoggedIn, async (req,res)=>{
   const {id_por} = req.params;
   await pool.query('delete from porciones where id_por= ?',[id_por]);
   res.redirect('back');
});
//-------DASHBOARD------SECCIONES--------------------------------------------------------------->
router.get('/secciones', isLoggedIn, async (req,res)=>{
   const {id_direc} = req.user
   const sections= await pool.query('select * from secciones where id_direc=?',[id_direc]);
   res.render('dashboard/secciones',{sections});
});
//adicionar---secciones------------------>
router.get('/newsec', isLoggedIn, async (req,res)=>{
   const {id_direc}= req.user;
   const seco= await pool.query('select * from direcciones where id_direc=?',[id_direc]);
   res.render('dashboard/newsec',{seco});
});
router.post('/newsect',isLoggedIn, async (req,res)=>{
    const {nombresec,id_direc}= req.body;
    const newse = {
       nombresec,
       id_direc,
    };
    await pool.query('insert into secciones set ?', [newse] );
    req.flash('message','se adicionó la sección con exito!');

    res.redirect('/dashboard/secciones');
});
//eliminar---secciones-------------------->
router.get('/deletesec/:id_sec', isLoggedIn,async (req,res)=>{
    const {id_sec} = req.params;
    await pool.query('delete from secciones where id_sec = ?',[id_sec]);
    req.flash('message','la sección fue eliminada con exito !');
    res.redirect('/dashboard/secciones');
});
//------------LISTA---DE---PEDIDOS------------------------------------------------------------>
router.get('/pedidos', isLoggedIn, async (req,res)=>{
    const {id_direc} = req.user;
    const pedi = await pool.query('select * from confirmados where id_direc = ?  ',[id_direc]);
    res.render('dashboard/pedidos',{pedi}); 
   });
//eliminar----------pedidos---------confirmados--------------------->
   router.get('/hecho/:id_pedidos', isLoggedIn, async (req,res)=>{
    const {id_pedidos}=req.params;
    await pool.query('delete from pedidos where id_pedidos= ?',[id_pedidos]);
   });
//ver---informacion---del----pedido----------------------------------->
router.get('/infopedidos/:id_session', async (req,res)=>{
   const{id_session}=req.params;
 const info= await pool.query('select * from pedidos where id_session = ?',[id_session]);
 await asyncForEach(info, async (sect) => {
   sect.num = await pool.query('select distinct (telefono) from confirmados where id_session = ?',[id_session]);
 });
 res.render('dashboard/informacion',{info});
});
//eliminar----productos------------------------------------------------>
router.get('/deletePed/:id_session', async(req,res)=>{
   const {id_session}=req.params;
   await pool.query('delete from pedidos where id_session =?',[id_session]);
   await pool.query('delete from confirmados where id_session =?',[id_session]);
   req.flash('message','pedido concluido !');
   res.redirect('/dashboard/pedidos');
});
module.exports= router;
