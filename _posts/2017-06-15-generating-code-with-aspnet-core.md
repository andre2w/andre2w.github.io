---
author: Andre Torres
layout: post
asset-type: post
title: "Generating code with ASP.Net Core"
tags: 
- c#
- asp.net
---

One of the things that I really like in rails is tha hability to generate files using the scaffolding through the CLI, and recently I've started to learn ASP.Net Core. 

The .Net Core is playing nice with the CLI using `dotnet` to create projects, manage migrations and packages, and I could even Debug applications using VS Code, but one thing was missing, the scaffolder for the views and controllers, in Rails even without scaffolding was fast to create an controller, but now I had to deal with namespaces and imports to create a simple controller.
But let's stop with the story time and see something useful. 

## Creating a ASP.Net Core project

Obviously that the first thing is to download .Net Core from https://www.microsoft.com/net/core

With the CLI installed we can start our new project 

```
mkdir ASPBlog
cd ASPBlog
dotnet new mvc
dotnet restore
```

And now to start generate code for your ASP.NET Core application you first need to add three dependencies in your `.csproj` file. 

The first one is the Fallback to the `dotNet Framework` because not every package is working with `.Net Core`, I'm hoping that this will change with Core 2.0.
```
<PropertyGroup>
    <TargetFramework>netcoreapp1.1</TargetFramework>
    <PackageTargetFallback>$(PackageTargetFallback);dotnet5.6;portable-net45+win8</PackageTargetFallback>
</PropertyGroup>
```

Then you add the following package:
```
<PackageReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Design" Version="1.1.1" />
```

And finally you add the Cli Tool:
```
<ItemGroup>
    <DotNetCliToolReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Tools" Version="1.0.0" />    
 </ItemGroup> 
```

And the final step is to execute a `dotnet restore`, And now you can check if the generator is up and running with `dotnet aspnet-codegenerator`

```
Usage: dotnet aspnet-codegenerator --project [projectname] [code generator name]

Code Generators:
view
controller
area

Try dotnet aspnet-codegenerator --project [projectname] [code generator name] -? for help about specific code generator.
RunTime 00:00:06.74
```

### Controllers 

For the Controller scaffolder we have the following commands: 
```
Options:
  --help|-h|-?                         Show help information
  --useAsyncActions|-async             Switch to indicate whether to generate async controller actions
  --noViews|-nv                        Switch to indicate whether to generate CRUD views
  --controllerName|-name               Name of the controller
  --restWithNoViews|-api               Specify this switch to generate a Controller with REST style API, noViews is assumed and any view related options are ignored
  --readWriteActions|-actions          Specify this switch to generate Controller with read/write actions when a Model class is not used
  --model|-m                           Model class to use
  --dataContext|-dc                    DbContext class to use
  --referenceScriptLibraries|-scripts  Switch to specify whether to reference script libraries in the generated views
  --layout|-l                          Custom Layout page to use
  --useDefaultLayout|-udl              Switch to specify that default layout should be used for the views
  --force|-f                           Use this option to overwrite existing files
```

### Generating our first controller

Let's start by creating an empty controller for our static pages like About, and Contact. Run the following command: 
`dotnet aspnet-codegenerator controller -name StaticPagesController -outDir Controllers`

If everything went alright you should have a new file called `StaticPagesController.cs` and the file look like this: 
```
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace ASPBlog.Controllers
{
    public class StaticPagesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
```

The generator created an controller with all usings, namespace and Index action.
But what are the arguments the was used? 
The `-name` parameter defines the name of the controller and `-outDir` set the folder that the controller will be created.In case you don't use `-outDir` the controller will be created in the root of the project.
With the controller created all is needed is to add the About and Contact actions by adding the following code to the class: 
```
        public IActionResult Contact()
        {
            return View();
        }

        public IActionResult About()
        {
            return View();
        }
```

And finally we can create an view to test our code. 
Create the necessary files and folders of the path `Views/StaticPages/About.cshtml` and add:
```
@{
    ViewData["Title"] = "About";
}

Normally, both your asses would be dead as fucking fried chicken, but you happen to pull this shit while I'm in a transitional period so I don't wanna kill you, I wanna help you. 
But I can't give you this case, it don't belong to me. Besides, I've already been through too much shit this morning over this case to hand it over to your dumb ass.

Now that we know who you are, I know who I am. I'm not a mistake! It all makes sense! 
In a comic, you know how you can tell who the arch-villain's going to be? He's the exact opposite of the hero. 
And most times they're friends, like you and me! I should've known way back when... You know why, David? Because of the kids. 
They called me Mr Glass.
```

We can check the result by running the ASP.Net server with `dotnet run`  and visiting `http://localhost:5000/StaticPages/About`.

### Controller with CRUD 
We can do more, some controllers are simple crud controllers, with an context and some actions. We can create an controller for our posts with everything we need using only the `aspnet-codegenerator`.

First we need a Model and a Database. In this case let's use SQLite and a Post model with title and body.

#### Post Model
Not the HTTP post, is the one we do in blogs. We create the file `Models/Post.cs`
```
using System.ComponentModel.DataAnnotations;

namespace ASPBlog.Models
{
    public class Post
    {
        public int Id { get; set; }
        public string Title { get; set; }

        [DataType(DataType.MultilineText)]
        public string Body { get; set; }
    }
}
```

#### SQLite database

Add the following packages to your `.csproj` file:
```
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="1.1.2" />

<DotNetCliToolReference Include="Microsoft.EntityFrameworkCore.Tools.DotNet" Version="1.0.0" />
```

and finally restore the packages with `dotnet restore`. Now we create a Context for EntityFramework so we can persist our model. 

Create the file `Context/BlogContext.cs`:
```
using Microsoft.EntityFrameworkCore;
using ASPBlog.Models;

namespace ASPBlog.Context {
    public class BlogContext : DbContext
    {
        public BlogContext(DbContextOptions<BlogContext> options) : base(options) 
        {}

        public DbSet<Post> Posts { get; set; }
    }
}
```

and in the `Startup.cs` we need add EntityFrameworkCore, and Context namespace also we need to configure our database.

```
using Microsoft.EntityFrameworkCore;
using ASPBlog.Context;

...

        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddMvc();
            services.AddDbContext<BlogContext>(options => 
                options.UseSqlite("Data Source=ASPBlog.db") 
            );
        }
		
...
```

With our Model and Database configurated we just need to run the commands to create the migrations and generate the database.
```
dotnet ef migrations add "Initial Commit"
dotnet ef database update
```

#### Generating a CRUD for Post

Now that everyting is created and in place we can generate our `PostsController`. Run the following command:

`dotnet aspnet-codegenerator controller -name
PostsController -outDir Controllers -m Post -dc BlogContext`

Those are the new parameters that we used:
* `-m`: It's the Model that we want to use to create the actions in the controller. 
* `-dc`: this is the DataContext parameter. We are doing CRUD operations, so we have to look in a database and the Context  

Now let's take a look at the controller that we generated: 

```
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using ASPBlog.Context;
using ASPBlog.Models;

namespace ASPBlog.Controllers
{
    public class PostsController : Controller
    {
        private readonly BlogContext _context;

        public PostsController(BlogContext context)
        {
            _context = context;    
        }

        // GET: Posts
        public async Task<IActionResult> Index()
        {
            return View(await _context.Posts.ToListAsync());
        }

        // GET: Posts/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var post = await _context.Posts
                .SingleOrDefaultAsync(m => m.Id == id);
            if (post == null)
            {
                return NotFound();
            }

            return View(post);
        }

        // GET: Posts/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Posts/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Title,Body")] Post post)
        {
            if (ModelState.IsValid)
            {
                _context.Add(post);
                await _context.SaveChangesAsync();
                return RedirectToAction("Index");
            }
            return View(post);
        }

        // GET: Posts/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var post = await _context.Posts.SingleOrDefaultAsync(m => m.Id == id);
            if (post == null)
            {
                return NotFound();
            }
            return View(post);
        }

        // POST: Posts/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Title,Body")] Post post)
        {
            if (id != post.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(post);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PostExists(post.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction("Index");
            }
            return View(post);
        }

        // GET: Posts/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var post = await _context.Posts
                .SingleOrDefaultAsync(m => m.Id == id);
            if (post == null)
            {
                return NotFound();
            }

            return View(post);
        }

        // POST: Posts/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var post = await _context.Posts.SingleOrDefaultAsync(m => m.Id == id);
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return RedirectToAction("Index");
        }

        private bool PostExists(int id)
        {
            return _context.Posts.Any(e => e.Id == id);
        }
    }
}
```

With one line of code we have an controller with all actions for a CRUD using `async` and `await`, but wait, there is more. The code generator also created an folder with all views for this controller, look at the `Views/Posts` folder. And finally visit http://localhost:5000/Posts/Create to see the result.

That's it people, thanks. 


