import { useEffect, useState } from 'react'
import axios from 'axios'

const BACKEND = 'https://natural-healing-b.onrender.com'
const PAYSTACK_KEY = 'pk_test_cfb90913888b72d0f5d8d40f6ade5a7b99d98665'
const ADMIN_PASS = 'admeen1739'

export default function App(){
  const [view, setView] = useState('landing') // landing | login | shop | product | cart | admin
  const [products,setProducts] = useState([])
  const [cart,setCart] = useState([])
  const [email,setEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('nature_user')||'null'))

  // Auth forms
  const [authForm, setAuthForm] = useState({ name:'', email:'', password:'', role:'user' })
  const [isLogin, setIsLogin] = useState(true)

  // Admin form
  const [form, setForm] = useState({ name:'', price:'', description:'', image:'', stock:'10' })
  const [editingId, setEditingId] = useState(null)

  const loadProducts = ()=> axios.get(`${BACKEND}/api/products`).then(r=>setProducts(r.data))
  useEffect(()=>{ loadProducts() 
    if(window.location.search.includes('admin') && user?.role==='admin') setView('admin')
  },[])

  const total = cart.reduce((s,p)=> s + Number(p.price), 0)

  // --- AUTH ---
  const handleAuth = async()=>{
    try{
      const url = isLogin ? `${BACKEND}/api/auth/login` : `${BACKEND}/api/auth/register`
      const res = await axios.post(url, authForm)
      localStorage.setItem('nature_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      setEmail(res.data.user.email)
      if(res.data.user.role==='admin') setView('admin')
      else setView('shop')
    }catch(e){ 
      // If backend auth not ready, fallback to local demo:
      // Check admin secret
      if(authForm.role==='admin' && authForm.password!==ADMIN_PASS){
        return alert('Wrong admin secret! Admin password must be admeen1739')
      }
      if(!isLogin){
        const newUser = { ...authForm, id: Date.now() }
        localStorage.setItem('nature_user', JSON.stringify(newUser))
        setUser(newUser)
        setEmail(newUser.email)
        setView(newUser.role==='admin' ? 'admin' : 'shop')
      } else {
        // simple login check for demo admin
        if(authForm.password===ADMIN_PASS){
          const adminUser = { name:'Admin', email: authForm.email, role:'admin' }
          localStorage.setItem('nature_user', JSON.stringify(adminUser))
          setUser(adminUser)
          setEmail(adminUser.email)
          setView('admin')
        } else {
          const demoUser = { name: authForm.email.split('@')[0], email: authForm.email, role:'user' }
          localStorage.setItem('nature_user', JSON.stringify(demoUser))
          setUser(demoUser)
          setEmail(demoUser.email)
          setView('shop')
        }
      }
    }
  }

  const logout = ()=>{
    localStorage.removeItem('nature_user')
    setUser(null)
    setView('landing')
  }

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
  const edit = (p)=>{ setForm(p); setEditingId(p.id); window.scrollTo(0,0) }
  const del = async(id)=>{ if(!confirm('Delete?')) return; await axios.delete(`${BACKEND}/api/products/${id}`); loadProducts() }

  const pay = ()=>{
    if(!email) return alert('Enter email')
    if(cart.length===0) return alert('Cart empty')
    const ref = 'nature_'+Date.now()
    axios.post(`${BACKEND}/api/orders`,{ email, items: cart, total, paystackRef: ref, status: 'pending' })
    .then(()=>{
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY, email, amount: total*100, ref,
        onClose: ()=> alert('Payment cancelled'),
        callback: (res)=>{
          axios.post(`${BACKEND}/api/paystack/verify/${res.reference}`)
          .then(()=>{ alert('Payment Success!'); setCart([]); setView('shop') })
          .catch(()=> alert('Verify failed'))
        }
      })
      handler.openIframe()
    })
  }

  return (
    <>
      <div className="header" style={{background:'#1a4d2e', color:'white', padding:'12px 20px', display:'flex', justifyContent:'space-between'}}>
        <h2 onClick={()=> setView(user ? (user.role==='admin'?'admin':'shop') : 'landing')} style={{cursor:'pointer'}}>🌿 Nature Store</h2>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          {!user && <button onClick={()=>setView('login')}>Login</button>}
          {user && user.role==='user' && <>
            <button onClick={()=>setView('shop')}>Shop</button>
            <button onClick={()=>setView('cart')}>Cart ({cart.length})</button>
          </>}
          {user && <button onClick={logout}>Logout ({user.role})</button>}
        </div>
      </div>

      {/* LANDING FOR EVERYONE */}
      {view==='landing' && (
        <div style={{padding:20, maxWidth:900, margin:'auto', textAlign:'center'}}>
          <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e" style={{width:'100%', height:300, objectFit:'cover', borderRadius:16}}/>
          <h1 style={{marginTop:20}}>Power of Nature Healing 🌿</h1>
          <p style={{color:'#444', lineHeight:1.6, fontSize:16}}>
            We provide 100% natural healing products, herbs, oils and organic supplements to restore your health naturally.
            No chemicals. No side effects. Trusted by over 2,000 customers across Nigeria.
          </p>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:15, marginTop:20}}>
            <div style={{border:'1px solid #ddd', padding:15, borderRadius:12}}>🌱 100% Natural</div>
            <div style={{border:'1px solid #ddd', padding:15, borderRadius:12}}>🚚 Fast Delivery</div>
            <div style={{border:'1px solid #ddd', padding:15, borderRadius:12}}>💚 Trusted Healing</div>
          </div>
          <button className="btn" style={{marginTop:25, padding:'14px 30px', fontSize:18, background:'#1a4d2e', color:'white', borderRadius:10}} onClick={()=>setView('login')}>
            Get Started - Login / Sign Up
          </button>
        </div>
      )}

      {/* LOGIN / SIGNUP */}
      {view==='login' && (
        <div style={{padding:20, maxWidth:400, margin:'40px auto', border:'1px solid #eee', borderRadius:12}}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          {!isLogin && <input placeholder="Full Name" value={authForm.name} onChange={e=>setAuthForm({...authForm, name:e.target.value})} style={{padding:12, width:'100%', marginBottom:8}}/>}
          <input placeholder="Email" value={authForm.email} onChange={e=>setAuthForm({...authForm, email:e.target.value})} style={{padding:12, width:'100%', marginBottom:8}}/>
          <input type="password" placeholder="Password" value={authForm.password} onChange={e=>setAuthForm({...authForm, password:e.target.value})} style={{padding:12, width:'100%', marginBottom:8}}/>
          {!isLogin && (
            <select value={authForm.role} onChange={e=>setAuthForm({...authForm, role:e.target.value})} style={{padding:12, width:'100%', marginBottom:8}}>
              <option value="user">I am a Customer</option>
              <option value="admin">I am an Admin</option>
            </select>
          )}
          <button className="btn" style={{width:'100%', padding:12, background:'#1a4d2e', color:'white'}} onClick={handleAuth}>{isLogin ? 'Login' : 'Sign Up'}</button>
          <p style={{marginTop:10}}> {isLogin ? "No account?" : "Have account?"} <span style={{color:'green', cursor:'pointer'}} onClick={()=>setIsLogin(!isLogin)}>{isLogin ? 'Sign Up' : 'Login'}</span></p>
        </div>
      )}

      {/* SHOP - ONLY USER */}
      {view==='shop' && user?.role!=='admin' && (
        <div className="grid">
          {products.map(p=>(
            <div className="card" key={p.id}>
              <img src={p.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'} onClick={()=>{setSelectedProduct(p); setView('product')}} style={{cursor:'pointer'}}/>
              <h3>{p.name}</h3>
              <p style={{color:'#666', fontSize:14}}>{p.description?.slice(0,60)}</p>
              <strong>₦{p.price}</strong>
              <button className="btn" onClick={()=>setCart([...cart, p])}>Add to Cart</button>
            </div>
          ))}
          {products.length===0 && <p>No products yet.</p>}
        </div>
      )}

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

      {view==='cart' && (
        <div style={{padding:20, maxWidth:600, margin:'auto'}}>
          <h2>Your Cart</h2>
          {cart.map((p,i)=><div key={i} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:10}}><span>{p.name}</span><span>₦{p.price}</span></div>)}
          <h3>Total: ₦{total}</h3>
          <input placeholder="Your email for receipt" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:12, width:'100%', borderRadius:8, border:'1px solid #ccc'}} />
          <button className="btn" style={{marginTop:10, width:'100%'}} onClick={pay}>Pay with Paystack</button>
        </div>
      )}

      {/* ADMIN - ONLY ADMIN */}
      {view==='admin' && user?.role==='admin' && (
        <div style={{padding:20, maxWidth:700, margin:'auto'}}>
          <h2>{editingId ? 'Edit Product' : 'Create Product'} - Admin Only</h2>
          <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
          <input placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
          <input placeholder="Image URL" value={form.image} onChange={e=>setForm({...form, image:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
          <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} style={{padding:10, width:'100%', marginBottom:8}}/>
          <button className="btn" onClick={createOrUpdate}>{editingId ? 'Update' : 'Create'}</button>
          <hr style={{margin:'20px 0'}}/>
          <h3>All Products</h3>
          {products.map(p=>(
            <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding:10, border:'1px solid #eee', marginBottom:5}}>
              <span>{p.name} - ₦{p.price}</span>
              <span><button onClick={()=>edit(p)}>Edit</button> <button onClick={()=>del(p.id)} style={{color:'red'}}>Delete</button></span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
