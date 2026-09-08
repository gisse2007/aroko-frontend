/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiPackage, FiSettings, FiLogOut, FiArrowLeft,
  FiMail, FiPhone, FiMapPin, FiFileText, FiShield,
  FiCheckCircle, FiClock, FiXCircle, FiEye,
  FiHome, FiStar,
} from "react-icons/fi";

import api from "../../api/axios";
import { resolveImageUrl } from "../../utils/image";
import { useAuthContext } from "../../context/AuthContext";
import { useOrders } from "../../hooks/useOrders";
import Tooltip from "../../components/Tooltip/Tooltip";
import styles from "./PerfilCliente.module.css";


const TABS = [
  {
    id:"perfil",
    label:"Mi perfil",
    icon:FiUser
  },
  {
    id:"pedidos",
    label:"Mis pedidos",
    icon:FiPackage
  },
  {
    id:"domicilios",
    label:"Mis domicilios",
    icon:FiHome
  },
  {
    id:"config",
    label:"Configuración",
    icon:FiSettings
  },
];



function getNombre(user){
  return user?.nombre_usuario || user?.nombre || "Usuario";
}



function getInitials(user){

  const n=getNombre(user)||"";

  return n
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0,2)
    .map(w=>w[0].toUpperCase())
    .join("") || "?";

}



function getRolLabel(user){

  const r=(user?.rol ?? user?.nombre_rol ?? "")
    .toUpperCase();


  const map={

    CLIENTE:"Cliente",

    ADMINISTRADOR:"Administrador",

    ADMIN:"Administrador",

    EMPLEADO:"Empleado",

    PANADERO:"Panadero",

    REPARTIDOR:"Repartidor",

  };


  return map[r] ?? "Cliente";

}




function Avatar({user,size="md"}){


  const foto=user?.foto_url || user?.foto || null;

  const fotoUrl=resolveImageUrl(foto);



  return (

    <div className={`${styles.avatar} ${styles[`avatar_${size}`]}`}>

      {

        fotoUrl ?

        <img
          src={fotoUrl}
          alt=""
          className={styles.avatarImg}
        />

        :

        <span>
          {getInitials(user)}
        </span>

      }


    </div>

  );

}





const normalizeOrderStatus=(value)=>
 String(value ?? "")
 .trim()
 .toUpperCase();



const ORDER_STATUS={


 completed:[
   "ENTREGADO",
   "COMPLETADO"
 ],


 cancelled:[
   "CANCELADO",
   "CANCELADA",
   "RECHAZADO"
 ],


 pending:[
   "PENDIENTE",
   "EN_PROCESO",
   "CONFIRMADO",
   "ACEPTADO"
 ]

};








function StatsRow({pedidos}){


 const total=pedidos.length;


 const completados=
 pedidos.filter(p=>
 ORDER_STATUS.completed.includes(
 normalizeOrderStatus(
 p.estado ?? p.status
 )
 )
 ).length;



 const pendientes=
 pedidos.filter(p=>{

 const estado=
 normalizeOrderStatus(
 p.estado ?? p.status
 );


 return !ORDER_STATUS.completed.includes(estado)
 &&
 !ORDER_STATUS.cancelled.includes(estado);


 }).length;




 const stats=[

 {
 icon:FiPackage,
 label:"Pedidos realizados",
 value:total
 },

 {
 icon:FiClock,
 label:"En proceso",
 value:pendientes
 },

 {
 icon:FiCheckCircle,
 label:"Completados",
 value:completados
 },

 {
 icon:FiStar,
 label:"Puntos acumulados",
 value:total*10
 }

 ];



 return (

 <div className={styles.statsRow}>

 {
 stats.map(({icon:Icon,label,value})=>(

 <div
 key={label}
 className={styles.statCard}
 >

 <div className={styles.statIcon}>
 <Icon/>
 </div>


 <div>

 <p className={styles.statValue}>
 {value}
 </p>


 <p className={styles.statLabel}>
 {label}
 </p>

 </div>


 </div>


 ))

 }


 </div>

 );


}








function TabPerfil({user,pedidos}){


 const fields=[


 {
 icon:FiMail,
 label:"Correo electrónico",
 value:user?.correo
 },


 {
 icon:FiPhone,
 label:"Teléfono",
 value:user?.telefono
 },


 {
 icon:FiMapPin,
 label:"Dirección",
 value:user?.direccion
 },


 {
 icon:FiFileText,
 label:"Tipo documento",
 value:user?.tipo_documento
 },


 {
 icon:FiFileText,
 label:"Documento",
 value:user?.numero_documento
 },


 {
 icon:FiShield,
 label:"Rol",
 value:getRolLabel(user)
 }


 ].filter(x=>x.value);





 return (

 <div className={styles.tabContent}>


 <div className={styles.heroCard}>

 <div className={styles.heroInner}>


 <Avatar
 user={user}
 size="xl"
 />


 <div className={styles.heroMeta}>


 <h2 className={styles.heroName}>
 {getNombre(user)}
 </h2>


 <p className={styles.heroEmail}>
 {user?.correo}
 </p>


 </div>


 </div>


 </div>



 <StatsRow pedidos={pedidos}/>



 <div className={styles.card}>


 <h3 className={styles.cardTitle}>
 Información personal
 </h3>


 <div className={styles.infoGrid}>


 {
 fields.map(({icon:Icon,label,value})=>(


 <div
 key={label}
 className={styles.infoItem}
 >

 <div className={styles.infoIcon}>
 <Icon/>
 </div>


 <div>

 <p className={styles.infoLabel}>
 {label}
 </p>


 <p className={styles.infoValue}>
 {value}
 </p>


 </div>


 </div>


 ))

 }



 </div>


 </div>


 </div>

 );

}







function TabPedidos(){


 const [pedidos,setPedidos]=useState([]);

 const [loading,setLoading]=useState(true);

 const [error,setError]=useState("");

 const [detalle,setDetalle]=useState(null);

 const {fetchMyOrders}=useOrders();



 useEffect(()=>{


 fetchMyOrders()

 .then(data=>{

 // ordenar por fecha ascendente para que el #1 sea el más antiguo
 const lista=Array.isArray(data) ? data : [];
 const ordenados=[...lista].sort((a,b)=>{
 const fa=a.fecha_pedido ?? a.created_at ?? "";
 const fb=b.fecha_pedido ?? b.created_at ?? "";
 return fa.localeCompare(fb);
 });
 setPedidos(ordenados);

 })

 .catch(()=>setError("No se pudieron cargar los pedidos."))

 .finally(()=>setLoading(false));


 },[]);





 if(loading)

 return (

 <div className={styles.card}>
 Cargando pedidos...
 </div>

 );


 if(error)

 return (

 <div className={styles.card}>
 <p>{error}</p>
 </div>

 );




 return (

 <div className={styles.tabContent}>


 <div className={styles.card}>


 <h3 className={styles.cardTitle}>
 Mis pedidos
 </h3>



 {
 pedidos.length===0 ?


 <p>
 No tienes pedidos todavía.
 </p>


 :

 pedidos.map((p,i)=>{

 const idPedido=p.id_pedido ?? p.id ?? i;
 const estado=p.estado ?? p.status ?? "—";
 const total=p.total ?? p.valor_total ?? null;

 return (

 <div
 key={idPedido}
 className={styles.pedidoRow}
 >


 <div className={styles.pedidoIconWrap}>
 <FiPackage/>
 </div>



 <div className={styles.pedidoInfo}>


 <p className={styles.pedidoId}>
 Pedido #{i+1}
 </p>


 <p>
 Estado: {estado}
 </p>


 {p.fecha_pedido &&
 <p className={styles.pedidoFecha}>
 {p.fecha_pedido.split("T")[0]}
 </p>
 }


 </div>


 {total!==null &&
 <span className={styles.pedidoTotal}>
 ${Number(total).toLocaleString("es-CO")}
 </span>
 }


 <Tooltip label="Ver detalle">
  <button
  className={styles.btnVerDetalle}
  onClick={()=>setDetalle(p)}
  aria-label="Ver detalle"
  >
  <FiEye/>
  </button>
 </Tooltip>


 </div>

 );

 })

 }



 </div>


 {/* Modal detalle */}
 {
 detalle &&

 <div className={styles.detalleOverlay} onClick={()=>setDetalle(null)}>

 <div className={styles.detalleModal} onClick={e=>e.stopPropagation()}>


 <div className={styles.detalleHeader}>

 <h3>Detalle del pedido</h3>

 <button
 className={styles.detalleClose}
 onClick={()=>setDetalle(null)}
 >
 <FiXCircle/>
 </button>

 </div>


 <div className={styles.detalleBody}>


 <div className={styles.detalleGrid}>

 <div>
 <p className={styles.detalleLabel}>Número</p>
 <p className={styles.detalleVal}>
 Pedido #{pedidos.indexOf(detalle)+1}
 </p>
 </div>

 <div>
 <p className={styles.detalleLabel}>Estado</p>
 <p className={styles.detalleVal}>
 {detalle.estado ?? detalle.status ?? "—"}
 </p>
 </div>

 <div>
 <p className={styles.detalleLabel}>Fecha</p>
 <p className={styles.detalleVal}>
 {(detalle.fecha_pedido ?? detalle.created_at ?? "").split("T")[0] || "—"}
 </p>
 </div>

 {
 (detalle.fecha_entrega) &&
 <div>
 <p className={styles.detalleLabel}>Fecha de entrega</p>
 <p className={styles.detalleVal}>
 {detalle.fecha_entrega.split("T")[0]}
 </p>
 </div>
 }

 <div>
 <p className={styles.detalleLabel}>Total</p>
 <p className={styles.detalleVal}>
 ${
 Number(detalle.total ?? detalle.valor_total ?? 0)
 .toLocaleString("es-CO")
 }
 </p>
 </div>

 {
 detalle.tipo_pago &&
 <div>
 <p className={styles.detalleLabel}>Tipo de pago</p>
 <p className={styles.detalleVal}>{detalle.tipo_pago}</p>
 </div>
 }

 {
 detalle.direccion &&
 <div>
 <p className={styles.detalleLabel}>Dirección</p>
 <p className={styles.detalleVal}>{detalle.direccion}</p>
 </div>
 }

 </div>


 {
 Array.isArray(detalle.detalle) && detalle.detalle.length>0 &&

 <div className={styles.detalleItems}>

 <p className={styles.detalleLabel}>Productos</p>

 {
 detalle.detalle.map((item,idx)=>(

 <div key={idx} className={styles.detalleItemRow}>

 <span className={styles.detalleItemNombre}>
 {item.nombre ?? item.producto_nombre ?? item.name ?? `Producto ${idx+1}`}
 </span>

 <span className={styles.detalleItemQty}>
 x{item.cantidad ?? item.quantity ?? 1}
 </span>

 <span className={styles.detalleItemSub}>
 ${
 Number(item.subtotal ?? (item.precio * (item.cantidad ?? 1))) || 0
 .toLocaleString("es-CO")
 }
 </span>

 </div>

 ))
 }

 </div>

 }


 {
 detalle.observaciones &&
 <div>
 <p className={styles.detalleLabel}>Observaciones</p>
 <p className={styles.detalleVal}>{detalle.observaciones}</p>
 </div>
 }


 </div>


 </div>

 </div>

 }


 </div>


 );


}



// ==========================================
// TAB DOMICILIOS
// ==========================================

function TabDomicilios(){


  const [domicilios,setDomicilios]=useState([]);

  const [loading,setLoading]=useState(true);



  useEffect(()=>{


    api.get("/domicilios/mis-domicilios")

    .then(({data})=>{

      // el backend puede responder con data.data, data.domicilios, o un array directo
      const lista=
        data.data ??
        data.domicilios ??
        (Array.isArray(data) ? data : []);

      setDomicilios(lista);


    })

    .catch(error=>{


      console.error(
        "Error cargando domicilios:",
        error
      );


    })

    .finally(()=>{

      setLoading(false);

    });



  },[]);





  if(loading){


    return (

      <div className={styles.card}>

        Cargando domicilios...

      </div>

    );


  }







  return (

    <div className={styles.tabContent}>


      <div className={styles.card}>


        <div className={styles.cardHeader}>


          <div>

            <h3 className={styles.cardTitle}>
              Mis domicilios
            </h3>


            <p className={styles.cardDesc}>
              Direcciones utilizadas para tus entregas.
            </p>


          </div>


        </div>





        {
          domicilios.length===0 ?


          (

            <div className={styles.empty}>


              <FiHome
                className={styles.emptyIcon}
              />


              <p className={styles.emptyTitle}>
                No tienes domicilios registrados
              </p>


              <p className={styles.emptyDesc}>
                Agrega una dirección para recibir tus pedidos.
              </p>


            </div>


          )

          :

          domicilios.map((d)=>(


            <div

              key={d.id_domicilio}

              className={styles.pedidoRow}

            >



              <div className={styles.pedidoIconWrap}>

                <FiMapPin/>

              </div>




              <div className={styles.pedidoInfo}>


                <p className={styles.pedidoId}>

                  {d.direccion}

                </p>



                <p className={styles.pedidoFecha}>

                  Barrio:
                  {" "}
                  {d.barrio}

                </p>




                {
                  d.referencias &&

                  <p>

                    Referencia:
                    {" "}
                    {d.referencias}

                  </p>

                }



              </div>





              <span className={styles.tag}>

                {d.estado}

              </span>



            </div>


          ))


        }



      </div>


    </div>

  );

}








// ==========================================
// TAB CONFIGURACION
// ==========================================


function TabConfig({user,onLogout}){


 const {setUser}=useAuthContext();



 const [form,setForm]=useState({

  nombre_usuario:getNombre(user),

  telefono:user?.telefono || "",

  direccion:user?.direccion || "",

  email:user?.correo || ""

 });



 const [mensaje,setMensaje]=useState("");

 const [busy,setBusy]=useState(false);





 const guardar=async(e)=>{


 e.preventDefault();


 setBusy(true);



 try{


 await api.put(
  "/clientes/perfil",
  {

   nombre:form.nombre_usuario,

   telefono:form.telefono,

   direccion:form.direccion,

   email:form.email

  }
 );



 setUser({

 ...user,

 nombre_usuario:form.nombre_usuario,

 telefono:form.telefono,

 direccion:form.direccion,

 correo:form.email

 });



 setMensaje(
 "Datos actualizados correctamente."
 );



 }catch(error){


 setMensaje(
 error?.response?.data?.message ||
 "Error actualizando datos."
 );


 }finally{


 setBusy(false);


 }



 };






 return (

 <div className={styles.tabContent}>


 <div className={styles.card}>


 <h3 className={styles.cardTitle}>
 Datos personales
 </h3>



 <form
 onSubmit={guardar}
 className={styles.form}
 >



 <div className={styles.formRow}>


 <div className={styles.field}>

 <label>
 Nombre
 </label>


 <input

 value={form.nombre_usuario}

 onChange={
 e=>setForm({

 ...form,

 nombre_usuario:e.target.value

 })
 }

 />


 </div>





 <div className={styles.field}>


 <label>
 Teléfono
 </label>


 <input

 value={form.telefono}

 onChange={
 e=>setForm({

 ...form,

 telefono:e.target.value

 })
 }

 />


 </div>






 <div className={styles.field}>


 <label>
 Correo
 </label>


 <input

 value={form.email}

 onChange={
 e=>setForm({

 ...form,

 email:e.target.value

 })
 }

 />


 </div>






 <div className={styles.field}>


 <label>
 Dirección
 </label>


 <input

 value={form.direccion}

 onChange={
 e=>setForm({

 ...form,

 direccion:e.target.value

 })
 }

 />


 </div>




 </div>




 {
 mensaje &&

 <p className={styles.msgOk}>
 {mensaje}
 </p>

 }




 <button

 className={styles.btnPrimary}

 disabled={busy}

 >

 {

 busy

 ?

 "Guardando..."

 :

 "Guardar cambios"

 }


 </button>



 </form>


 </div>



 <div className={`${styles.card} ${styles.dangerCard}`}>


 <button

 className={styles.btnDanger}

 onClick={onLogout}

 >

 <FiLogOut/>

 Cerrar sesión

 </button>


 </div>



 </div>


 );

}









// ==========================================
// PAGINA PERFIL CLIENTE
// ==========================================


export default function PerfilCliente({
 initialTab="perfil"
}){


 const {
 user,
 logout,
 refreshFromServer
 }=useAuthContext();



 const [tab,setTab]=useState(initialTab);



 const [pedidos,setPedidos]=useState([]);



 const navigate=useNavigate();



 const {fetchMyOrders}=useOrders();





 useEffect(()=>{


 const token=
 localStorage.getItem("token");



 if(token){

 refreshFromServer();

 }



 fetchMyOrders()

 .then(data=>{


 setPedidos(
 Array.isArray(data)
 ? data
 : []
 );


 })

 .catch(()=>{});



 },[]);







 const handleLogout=()=>{


 logout();


 navigate(
 "/landing",
 {
 replace:true
 }
 );


 };







 return (

 <div className={styles.page}>


<header className={styles.topbar}>


<button

className={styles.backBtn}

onClick={()=>navigate("/landing")}

>

<FiArrowLeft/>

Volver

</button>




<div className={styles.topbarRight}>


<Avatar
user={user}
size="sm"
/>


<span>

{getNombre(user)}

</span>


</div>



</header>





<div className={styles.layout}>


<aside className={styles.sidebar}>


<div className={styles.sidebarProfile}>


<Avatar
user={user}
size="xl"
/>


<p className={styles.sidebarName}>

{getNombre(user)}

</p>



<p className={styles.sidebarRole}>

{getRolLabel(user)}

</p>



</div>





<nav className={styles.nav}>


{

TABS.map(({id,label,icon:Icon})=>(


<button

key={id}

className={

`${styles.navBtn}

${tab===id ? styles.navBtnActive:""}

`

}

onClick={()=>setTab(id)}

>


<Icon/>

{label}


</button>


))


}


</nav>



</aside>






<main className={styles.main}>


{

tab==="perfil" &&

<TabPerfil

user={user}

pedidos={pedidos}

/>

}





{

tab==="pedidos" &&

<TabPedidos/>

}




{

tab==="domicilios" &&

<TabDomicilios/>

}




{

tab==="config" &&

<TabConfig

user={user}

onLogout={handleLogout}

/>

}



</main>



</div>



</div>

 );


}