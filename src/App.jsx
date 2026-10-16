import { useEffect, useState } from 'react'
import axios from 'axios'

const BACKEND = 'https://natural-healing-b.onrender.com' // <-- PUT YOUR REAL RENDER URL HERE
const PAYSTACK_KEY = 'pk_test_cfb90913888b72d0f5d8d40f6ade5a7b99d98665'
const ADMIN_PASS = 'admeen1739' // change this

export default function App(){
  const [view, setView] = useState('shop') // shop | product | cart | admin
  const [products,setProducts] = useState([])
  const [cart,setCart] = useState([])
  const [email,setEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Admin form
  const [form, setForm] = useState({ name:'', price:'', description:'', image:'', stock:'10' })
  const [editingId, setEditingId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [passInput, setPassInput] = useState('')

  const loadProducts = ()=> axios.get(`${BACKEND}/api/products`).then(r=>setProducts(r.data))
  useEffect(()=>{ loadProducts() },[])

  const total = cart.reduce((s,p)=> s + Number(p.price), 0)

  // --- ADMIN CRUD ---
  const createOrUpdate = async()=>{
    try{
      if(editingId){
        await axios.put(`${BACKEND}/api/products/${editingId}`, {...form, price:Number(form.price)})
      }else{
        await axios.post(`${BACKEND}/api/products`, {...form, price:Number(form.price)})
      }
      setForm({ name:'', price:'', description:'', image:'', stock:'10' })
      setEditingId(null)
      loadProducts()
      alert('Saved!')
    }catch(e){ alert(e.response?.data?.message || 'Error') }
  }

  const edit = (p)=>{
    setForm(p)
    setEditingId(p.id)
    window.scrollTo(0,0)
  }

  const del = async(id)=>{
    if(!confirm('Delete product?')) return
    await axios.delete(`${BACKEND}/api/products/${id}`)
    loadProducts()
  }

  // --- BUY ---
  const pay = ()=>{
    if(!email) return alert('Enter email for receipt')
    if(cart.length===0) return alert('Cart empty')
    const ref = 'nature_'+Date.now()
    axios.post(`${BACKEND}/api/orders`,{
      email, items: cart, total, paystackRef: ref, status: 'pending'
    }).then(()=>{
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY, email, amount: total*100, ref,
        onClose: ()=> alert('Payment cancelled'),
        callback: (response)=>{
          axios.post(`${BACKEND}/api/paystack/verify/${response.reference}`)
          .then(()=>{ alert('Payment Success! Order Paid'); setCart([]); setView('shop') })
          .catch(()=> alert('Verify failed - contact support'))
        }
      })
      handler.openIframe()
    })
  }

  return (
    <>
      <div className="header">
        <h2 onClick={()=>setView('shop')} style={{cursor:'pointer'}}>🌿 Nature Store</h2>
        <div style={{display:'flex', gap:10}}>
          <button onClick={()=>setView('shop')}>Shop</button>
          <button onClick={()=>setView('cart')}>Cart ({cart.length}) ₦{total}</button>
          <button onClick={()=>setView('admin')}>Admin</button>
        </div>
      </div>

      {/* SHOP */}
      {view==='shop' && (
        <div className="grid">
          {products.map(p=>(
            <div className="card" key={p.id}>
              <img src={p.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'} 
                   onClick={()=>{setSelectedProduct(p); setView('product')}} style={{cursor:'pointer'}}/>
              <h3>{p.name}</h3>
              <p style={{color:'#666', fontSize:14}}>{p.description?.slice(0,60)}</p>
              <strong>₦{p.price}</strong>
              <button className="btn" onClick={()=>setCart([...cart, p])}>Add to Cart</button>
            </div>
          ))}
          {products.length===0 && <p>No products. Go to Admin to create.</p>}
        </div>
      )}

      {/* PRODUCT DETAIL */}
      {view==='product' && selectedProduct && (
        <div style={{padding:20, maxWidth:700, margin:'auto'}}>
          <button onClick={()=>setView('shop')}>← Back</button>
          <img src={selectedProduct.image} style={{width:'100%', borderRadius:12, marginTop:10}} />
          <h2>{selectedProduct.name}</h2>
          <p>{selectedProduct.description}</p>
          <h3>₦{selectedProduct.price}</h3>
          <button className="btn" onClick={()=>{setCart([...cart, selectedProduct]); setView('cart')}}>Buy Now</button>
        </div>
      )}

      {/* CART / BUY PAGE */}
      {view==='cart' && (
        <div style={{padding:20, maxWidth:600, margin:'auto'}}>
          <h2>Your Cart</h2>
          {cart.map((p,i)=><div key={i} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:10}}><span>{p.name}</span><span>₦{p.price}</span></div>)}
          <h3>Total: ₦{total}</h3>
          <input placeholder="Your email for receipt" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:12, width:'100%', borderRadius:8, border:'1px solid #ccc'}} />
          <button className="btn" style={{marginTop:10, width:'100%'}} onClick={pay}>Pay with Paystack</button>
        </div>
      )}

      {/* ADMIN */}
      {view==='admin' && (
        <div style={{padding:20, maxWidth:700, margin:'auto'}}>
          {!isAdmin ? (
            <div>
              <h2>Admin Login</h2>
              <input type="password" placeholder="Enter admin password" value={passInput} onChange={e=>setPassInput(e.target.value)} style={{padding:10}}/>
              <button onClick={()=>{if(passInput===ADMIN_PASS) setIsAdmin(true); else alert('Wrong password')}}>Login</button>
            </div>
          ):(
            <>
              <h2>{editingId ? 'Edit Product' : 'Create Product'}</h2>
              <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
              <input placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
              <input placeholder="Image URL" value={form.image} onChange={e=>setForm({...form, image:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
              <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
              <button className="btn" onClick={createOrUpdate}>{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button onClick={()=>{setEditingId(null); setForm({ name:'', price:'', description:'', image:'', stock:'10' })}}>Cancel Edit</button>}

              <hr style={{margin:'20px 0'}}/>
              <h3>All Products (Edit/Delete)</h3>
              {products.map(p=>(
                <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding:10, border:'1px solid #eee', marginBottom:5}}>
                  <span>{p.name} - ₦{p.price}</span>
                  <span><button onClick={()=>edit(p)}>Edit</button> <button onClick={()=>del(p.id)} style={{color:'red'}}>Delete</button></span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  )
}
