import bpy, math, random, os
from mathutils import Vector
from math import pi
random.seed(12)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'dist/assets');os.makedirs(OUT,exist_ok=True)
def mat(name,h,rough=.7,metal=0,emit=0):
 h=h.lstrip('#');rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)];rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emit:b.inputs['Emission Color'].default_value=(*rgb,1);b.inputs['Emission Strength'].default_value=emit
 return m
M={k:mat(k,v) for k,v in {'cream':'eee6d5','wall':'f4e9d7','wall2':'e3d9c8','wood':'b48056','edge':'79523d','oak':'c79970','linen':'fff1da','sage':'95ae94','mint':'bed0b0','rust':'c48166','coral':'dfa38c','green':'557e60','leaf':'7f9c6d','ink':'384447','blue':'9dbbc2','gold':'c9a45f','pink':'e7b5a5','dark':'283e40','cat':'e2a963','catcream':'f8e5c3','stripe':'b47b42'}.items()}
M['screen']=mat('Screen blue','9abbb7',.35,0,.2);M['glow']=mat('Warm lamp','ffdc91',.4,0,2);M['black']=mat('Display bezel','273538',.28,.15);M['brass']=mat('Brushed brass','ad8c50',.35,.65)
def group(name,kind=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
 if kind:o['interactive']=kind
 return o
def finish(o,name,material,parent=None):
 o.name=name;o.data.materials.append(M.get(material,material))
 if parent:o.parent=parent
 return o
def box(name,loc,scale,material,bevel=.04,parent=None,rot=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:b=o.modifiers.new('Soft edges','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 if rot:o.rotation_euler=rot
 return finish(o,name,material,parent)
def sphere(name,loc,scale,material,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=loc);o=bpy.context.object;o.scale=scale
 for p in o.data.polygons:p.use_smooth=True
 return finish(o,name,material,parent)
def cyl(name,loc,r,depth,material,parent=None,rot=None,vertices=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);o=bpy.context.object;b=o.modifiers.new('Soft edge','BEVEL');b.width=.012;b.segments=2;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 if rot:o.rotation_euler=rot
 return finish(o,name,material,parent)
def rod(name,a,b,r,material,parent=None):
 d=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,material,parent);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def curve(name,pts,r,material,parent=None):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return finish(o,name,material,parent)
def plant(name,x,y,z,s=1,parent=None):
 bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.15*s,radius2=.21*s,depth=.31*s,location=(x,y,z+.16*s));finish(bpy.context.object,name+' pot','coral',parent);cyl(name+' soil',(x,y,z+.315*s),.18*s,.02*s,'edge',parent)
 for i in range(7):
  a=i*2.4;h=(.4+random.random()*.3)*s;dx=math.cos(a)*.24*s;dy=math.sin(a)*.24*s;rod(name+' stem',(x,y,z+.3*s),(x+dx,y+dy,z+h+.3*s),.014*s,'green',parent)
  l=sphere(name+' leaf',(x+dx,y+dy,z+h+.3*s),(.10*s,.21*s,.035*s),'leaf' if i%2 else 'green',parent);l.rotation_euler=(.5*math.cos(a),.4*math.sin(a),a)
# Room shell, with a real window opening.
shell=group('Architecture');box('Oak foundation',(0,0,-.12),(6.95,6.15,.34),'edge',.1,shell)
floormats=[mat('Oak tone '+str(i),c) for i,c in enumerate(['c39670','c69c77','cba47d','bd9069'])]
for i in range(20):
 for j in range(3):box('Floorboard',(-3.23+i*.34,-2+2*j,.073),(.331,1.987,.09),random.choice(floormats),.009,shell)
box('Back wall',(0,3,2),(6.9,.14,4),'wall',.035,shell)
for name,loc,dims in [('Left lower',(-3.4,0,.8),(.14,6,1.6)),('Left upper',(-3.4,0,3.8),(.14,6,.4)),('Left near pier',(-3.4,-2.45,2.6),(.14,1.1,2)),('Left far pier',(-3.4,2.175,2.6),(.14,1.65,2))]:box(name,loc,dims,'wall2',.025,shell)
for y in [-1.9,1.35]:box('Window jamb',(-3.34,y,2.58),(.21,.1,2.03),'wood',.018,shell)
for z in [1.57,3.58]:box('Window rail',(-3.34,-.275,z),(.21,3.35,.12),'wood',.018,shell)
box('Window mullion',(-3.34,-.275,2.58),(.16,.055,1.98),'wood',.01,shell);box('Window crossbar',(-3.34,-.275,2.6),(.16,3.2,.055),'wood',.01,shell);box('Window sill',(-3.22,-.275,1.52),(.52,3.52,.13),'cream',.035,shell)
rod('Curtain pole',(-3.10,-2.02,3.72),(-3.10,1.5,3.72),.035,'brass',shell)
for side in [-1.85,1.15]:
 for k in range(5):cyl('Linen curtain fold',(-3.07,side+(k*.065 if side<0 else -k*.065),2.68),.065,1.93,'linen',shell,vertices=16)
box('Back wall cap',(0,3.01,4.02),(7.04,.24,.10),'cream',.025,shell);box('Left wall cap',(-3.41,0,4.02),(.24,6.10,.10),'cream',.025,shell);box('Back skirting',(0,2.88,.25),(6.75,.07,.23),'cream',.015,shell);box('Left skirting',(-3.28,0,.25),(.07,6,.23),'cream',.015,shell)
# Work desk.
desk=group('Desk','work');box('Desk surface',(-2.36,-.12,1.36),(1.30,2.58,.13),'wood',.075,desk)
for x in [-2.88,-1.87]:
 for y in [-1.20,.96]:box('Desk leg',(x,y,.72),(.095,.095,1.3),'cream',.02,desk)
box('Drawer pedestal',(-2.39,.83,.75),(1.0,.43,1.12),'sage',.045,desk)
for z in [.42,.79,1.13]:box('Drawer front',(-1.88,.83,z),(.035,.37,.29),'mint',.025,desk);rod('Drawer handle',(-1.845,.73,z),(-1.845,.92,z),.015,'brass',desk)
box('Desk mat',(-2.1,-.32,1.436),(.65,1.40,.024),'sage',.035,desk);box('Monitor base',(-2.59,-.32,1.46),(.4,.46,.05),'cream',.035,desk);box('Monitor neck',(-2.70,-.32,1.67),(.065,.1,.43),'cream',.018,desk);box('Modern monitor',(-2.70,-.32,2.0),(.10,1.17,.77),'cream',.045,desk);box('Monitor glass',(-2.64,-.32,2.0),(.014,1.07,.65),'screen',.02,desk);box('Monitor sidebar',(-2.626,-.68,2),(.012,.2,.57),'dark',.01,desk)
for i in range(4):box('Code line',(-2.616,-.12,2.2-i*.115),(.012,.51-i*.06,.027),'linen',.008,desk)
box('Keyboard',(-1.99,-.35,1.469),(.33,.76,.035),'cream',.025,desk)
for j in range(4):
 for i in range(10):box('Keyboard key',(-2.11+j*.069,-.66+i*.068,1.493),(.05,.049,.018),'linen',.005,desk)
sphere('Mouse',(-1.97,.29,1.50),(.11,.075,.055),'linen',desk);cyl('Mug',(-2.10,-1.15,1.57),.105,.24,'rust',desk);cyl('Coffee',(-2.10,-1.15,1.695),.081,.005,'edge',desk);curve('Mug handle',[(-2.10,-1.245,1.65),(-2.10,-1.33,1.58),(-2.10,-1.25,1.49)],.023,'rust',desk);cyl('Pencil cup',(-2.77,.75,1.59),.09,.25,'pink',desk)
for i in range(4):rod('Pencil',(-2.80+i*.023,.75,1.56),(-2.82+i*.035,.75,1.98+random.random()*.08),.012,'wood',desk)
plant('Desk plant',-2.86,-1.18,1.42,.7,desk)
chair=group('Desk chair');cyl('Chair foot',(-1.15,-.3,.20),.40,.06,'cream',chair);rod('Chair post',(-1.15,-.3,.2),(-1.15,-.3,.75),.055,'brass',chair);box('Chair cushion',(-1.15,-.3,.78),(.72,.70,.18),'sage',.12,chair);box('Chair back',(-.81,-.3,1.08),(.13,.69,.67),'sage',.08,chair,rot=(0,-.13,0))
# Bookshelf.
shelf=group('Bookshelf','notes');box('Shelf back',(-2.32,2.80,1.64),(1.48,.07,3.08),'wood',.02,shelf)
for x in [-3.06,-1.58]:box('Shelf side',(x,2.57,1.65),(.11,.52,3.12),'wood',.025,shelf)
for z in [.19,.80,1.43,2.06,2.69,3.21]:box('Shelf board',(-2.32,2.57,z),(1.55,.54,.09),'oak',.025,shelf)
for row,z in enumerate([.85,1.48,2.11,2.74]):
 for i in range(7 if row!=2 else 4):
  x=-2.91+i*.18;h=random.uniform(.30,.45);box('Book',(x,2.53,z+h/2),(.13,.33,h),['sage','cream','rust','blue','pink','green','gold'][i],.015,shelf)
  for dz in [-.10,.1]:box('Spine detail',(x,2.355,z+h/2+dz),(.08,.012,.014),'linen',.003,shelf)
box('Woven basket',(-2.29,2.57,.48),(1.17,.43,.43),'cream',.035,shelf)
for i in range(12):box('Basket weave',(-2.80+i*.094,2.345,.47),(.018,.013,.37),'oak',.002,shelf)
plant('Shelf fern',-2.52,2.53,3.25,.73,shelf)
# Contemporary TV.
tv=group('Modern TV','play');box('Media cabinet',(-.23,2.56,.60),(2.28,.65,.79),'sage',.06,tv)
for x in [-1.12,.65]:
 for y in [2.33,2.77]:box('Cabinet leg',(x,y,.21),(.08,.08,.25),'wood',.025,tv)
for x in [-.80,.33]:box('Cabinet panel',(x,2.218,.62),(1.06,.025,.59),'mint',.025,tv);cyl('Cabinet knob',(x,2.192,.66),.034,.04,'brass',tv,rot=(pi/2,0,0))
box('Flat TV frame',(-.2,2.70,1.92),(1.92,.10,1.12),'black',.03,tv);box('TV screen',(-.2,2.641,1.93),(1.81,.012,1.00),'blue',.025,tv);box('TV horizon',(-.2,2.629,1.70),(1.77,.006,.49),'sage',.012,tv);sphere('TV sun',(.28,2.615,2.18),(.17,.007,.17),'linen',tv);sphere('TV landscape one',(-.55,2.613,1.72),(.48,.008,.18),'green',tv);sphere('TV landscape two',(.02,2.605,1.66),(.55,.008,.17),'leaf',tv)
for x in [-.83,.40]:rod('TV stand',(x,2.7,1.39),(x-.1,2.42,1.03),.025,'black',tv)
box('Remote',(.62,2.33,1.026),(.1,.26,.032),'cream',.02,tv)
world=group('Globe','about');box('Floating shelf',(-.03,2.66,3.16),(2.13,.55,.12),'wood',.025,world);cyl('Globe base',(.30,2.63,3.26),.22,.055,'brass',world);rod('Globe stem',(.30,2.63,3.27),(.30,2.63,3.41),.035,'brass',world);sphere('Globe earth',(.3,2.63,3.64),(.28,.28,.28),'blue',world)
for i in range(10):
 a=i*2.4;z=3.64+random.uniform(-.22,.22);rr=math.sqrt(max(0,.282**2-(z-3.64)**2));sphere('Globe continent',(.3+rr*math.cos(a),2.63+rr*math.sin(a),z),(.075,.04,.075),'leaf',world)
plant('Shelf sprig',-.72,2.6,3.23,.6,world)
box('Picture frame',(2.15,2.88,3.08),(1.15,.065,1.22),'wood',.025);box('Picture paper',(2.15,2.839,3.08),(1.03,.015,1.10),'linen',.01);sphere('Art sun',(2.30,2.82,3.30),(.19,.014,.19),'rust')
for i in range(3):rod('Art stem',(1.99,2.815,2.68),(2.02+(i-1)*.19,2.815,3.25),.012,'green')
for i in range(5):sphere('Art leaf',(1.95+(i%2)*.20,2.81,2.80+i*.085),(.10,.01,.04),'leaf')
# Bed, soft linens and blanket.
bed=group('Bed','bed');box('Oak bed platform',(2,.44,.38),(1.97,3.05,.38),'wood',.11,bed);box('Upholstered headboard',(2,1.99,.89),(2.05,.19,1.30),'coral',.15,bed)
for x in [1.3,2.7]:
 for y in [-.75,1.5]:cyl('Bed foot',(x,y,.17),.08,.25,'edge',bed)
box('Mattress',(2,.44,.65),(1.85,2.85,.31),'linen',.16,bed);box('Sage duvet',(2,.03,.855),(1.89,2.02,.22),'sage',.15,bed);box('Folded duvet edge',(2,.94,.92),(1.90,.22,.20),'mint',.09,bed)
for x in [1.56,2.42]:box('Pillow',(x,1.46,.94),(.73,.53,.22),'linen',.16,bed,rot=(.13,0,.04 if x<2 else -.07))
box('Accent cushion',(2.43,1.03,1.05),(.45,.40,.21),'rust',.12,bed,rot=(.1,.05,-.18));box('Terracotta throw',(2,-.61,1.00),(1.91,.63,.075),'coral',.045,bed)
for i in range(11):box('Throw stitch',(1.15+i*.17,-.61,1.042),(.012,.60,.007),'linen',.003,bed)
box('Throw drape',(2.93,-.60,.76),(.07,.62,.51),'coral',.035,bed)
for i in range(7):curve('Blanket fringe',[(2.95,-.85+i*.08,.52),(2.97,-.85+i*.08,.45)],.012,'linen',bed)
box('Nightstand',(3.08,1.6,.59),(.44,.67,.86),'cream',.06,bed);cyl('Lamp foot',(3.08,1.55,1.06),.14,.04,'brass',bed);rod('Lamp stem',(3.08,1.55,1.07),(3.08,1.55,1.33),.024,'brass',bed)
bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.21,radius2=.11,depth=.26,location=(3.08,1.55,1.40));finish(bpy.context.object,'Lamp shade','linen',bed);sphere('Lamp bulb',(3.08,1.55,1.32),(.055,.055,.06),'glow',bed)
rug=group('Rug');cyl('Woven rug',(-.05,-1.22,.15),1.28,.035,'linen',rug,vertices=96)
for r in [1.16,1.20,1.23]:curve('Rug stitching',[(-.05+math.cos(i*2*pi/64)*r,-1.22+math.sin(i*2*pi/64)*r,.173) for i in range(65)],.008,'oak',rug)
box('Floor cushion',(-1.70,-2.03,.30),(.76,.73,.26),'rust',.16,rot=(0,0,-.2));plant('Floor monstera',-2.72,-2.48,.13,1.35)
# Cat modeled from separate rounded meshes with a curved tail.
cat=group('Cat','cat');sphere('Cat body',(-.1,-1.18,.38),(.51,.32,.23),'cat',cat);sphere('Cat haunch',(.23,-1.10,.40),(.28,.30,.25),'cat',cat);sphere('Cat head',(-.47,-1.27,.46),(.25,.23,.24),'cat',cat);sphere('Cream muzzle',(-.54,-1.455,.39),(.15,.075,.085),'catcream',cat)
for x,y in [(-.63,-1.21),(-.33,-1.19)]:
 bpy.ops.mesh.primitive_cone_add(vertices=3,radius1=.135,radius2=.01,depth=.24,location=(x,y,.69));o=finish(bpy.context.object,'Cat ear','cat',cat);o.rotation_euler=(.08,0,.2);sphere('Pink inner ear',(x,y-.065,.70),(.057,.028,.070),'pink',cat)
for x in [-.61,-.40]:curve('Sleepy eye',[(x-.04,-1.463,.49),(x,-1.476,.47),(x+.04,-1.463,.49)],.008,'edge',cat)
sphere('Cat nose',(-.51,-1.535,.405),(.024,.012,.017),'pink',cat)
for i in range(2):sphere('Cat paw',(-.40+i*.19,-1.46,.235),(.14,.12,.067),'catcream',cat)
curve('Cat tail',[(.32,-1.0,.38),(.50,-1.24,.3),(.39,-1.52,.24),(.07,-1.60,.23),(-.12,-1.54,.23)],.075,'cat',cat)
for i in range(4):
 x=-.14+i*.13;curve('Tabby stripe',[(x,-.94,.52),(x-.02,-1.12,.606),(x,-1.27,.56)],.02,'stripe',cat)
for side in [-1,1]:
 for i in range(2):curve('Whisker',[(-.51+side*.08,-1.50,.4),(-.51+side*.29,-1.57,.40+i*.035)],.004,'catcream',cat)
# Easel.
e=group('Easel','sketch')
for x in [2.25,3.0]:rod('Easel leg',(x,-2.40,.15),(2.63+(x-2.63)*.68,-2.30,1.96),.032,'wood',e)
rod('Easel back leg',(2.63,-1.94,.15),(2.63,-2.28,1.90),.032,'wood',e);box('Easel ledge',(2.63,-2.40,.78),(1.05,.16,.06),'wood',.015,e);box('Canvas',(2.63,-2.32,1.36),(.87,.075,1.1),'linen',.015,e);sphere('Canvas circle',(2.77,-2.366,1.62),(.19,.014,.19),'rust',e);box('Canvas sage form',(2.47,-2.37,1.18),(.26,.016,.56),'sage',.1,e,rot=(0,-.12,0));box('Canvas peach form',(2.75,-2.376,1.03),(.32,.015,.29),'coral',.08,e);cyl('Paint jar',(3.02,-2.22,.32),.10,.33,'cream',e)
for i in range(3):rod('Brush',(3.0+i*.035,-2.22,.3),(2.98+i*.05,-2.22,.78),.012,'wood',e)
for x in [1.10,1.45]:sphere('Slipper sole',(x,-1.44,.16),(.12,.23,.04),'cream');sphere('Slipper top',(x,-1.38,.22),(.12,.13,.08),'coral')
box('Notebook',(-.71,-2.57,.20),(.45,.57,.09),'sage',.025,rot=(0,0,-.23))
# Export portable geometry with named interaction groups.
bpy.ops.object.select_all(action='DESELECT')
for o in list(bpy.context.scene.objects):
 if o.type=='CURVE':
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
for o in bpy.context.scene.objects:
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'room.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True)
# Blender master and offline preview. Main website lights are live Three.js lights.
w=bpy.context.scene.world or bpy.data.worlds.new('World');bpy.context.scene.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.78,.83,.90,1);w.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.object.light_add(type='SUN',location=(-8,-3,8));sun=bpy.context.object;sun.name='Afternoon sunlight';sun.data.energy=2.5;sun.data.angle=.07;sun.rotation_euler=Vector((1,.5,-.72)).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='AREA',location=(2,-5,8));fill=bpy.context.object;fill.data.energy=280;fill.data.shape='DISK';fill.data.size=7;fill.rotation_euler=(Vector((0,0,1.2))-fill.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(10,-14,11));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.2;bpy.context.scene.camera=cam
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=1200;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.film_transparent=True;s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG';s.render.filepath=os.path.join(OUT,'room-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'source','katrina-room.blend'));bpy.ops.render.render(write_still=True);print('ROOM_EXPORT_COMPLETE')
