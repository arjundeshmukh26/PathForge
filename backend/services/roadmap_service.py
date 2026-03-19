"""
Roadmap Service - Generates learning roadmaps for missing skills
"""

from typing import List, Dict, Any


def generate_roadmap(missing_skills: List[str]) -> List[Dict[str, Any]]:
    """
    Generate learning roadmap for missing skills
    
    Args:
        missing_skills: List of skills the user needs to learn
        
    Returns:
        List of roadmap items with skill and learning steps
    """
    if not missing_skills:
        return []
    
    roadmap = []
    
    for skill in missing_skills:
        steps = _get_learning_steps_for_skill(skill)
        roadmap.append({
            "skill": skill,
            "steps": steps
        })
    
    return roadmap


def _get_learning_steps_for_skill(skill: str) -> List[str]:
    """
    Get specific learning steps for a given skill
    
    Args:
        skill: The skill to create learning steps for
        
    Returns:
        List of learning steps
    """
    skill_lower = skill.lower().strip()
    
    # Skill-specific learning roadmaps
    specific_roadmaps = {
        # Programming Languages
        "javascript": [
            "Learn JavaScript fundamentals (variables, functions, objects)",
            "Master ES6+ features (arrow functions, destructuring, modules)",
            "Build interactive web pages with DOM manipulation",
            "Create a personal portfolio website project",
            "Learn asynchronous programming (Promises, async/await)"
        ],
        "python": [
            "Learn Python basics (syntax, data types, control structures)",
            "Master object-oriented programming in Python",
            "Work with popular libraries (requests, pandas, numpy)",
            "Build a data analysis or automation project",
            "Contribute to open source Python projects"
        ],
        "java": [
            "Learn Java fundamentals and OOP concepts",
            "Master collections framework and exception handling",
            "Build a console-based application",
            "Learn Spring framework basics",
            "Create a REST API project"
        ],
        "typescript": [
            "Learn JavaScript fundamentals first",
            "Master TypeScript types and interfaces",
            "Convert existing JavaScript projects to TypeScript",
            "Build a type-safe web application",
            "Learn advanced TypeScript features (generics, decorators)"
        ],
        "c#": [
            "Learn C# syntax and .NET fundamentals",
            "Master object-oriented programming concepts",
            "Build desktop applications with WinForms or WPF",
            "Create web APIs with ASP.NET Core",
            "Deploy applications to Azure"
        ],
        
        # Frontend Frameworks
        "react": [
            "Learn JavaScript and ES6+ thoroughly",
            "Master React components and JSX",
            "Learn state management with hooks",
            "Build several small React projects",
            "Create a full-featured SPA with routing and API integration"
        ],
        "vue.js": [
            "Learn JavaScript fundamentals",
            "Master Vue.js basics (components, directives, events)",
            "Learn Vue CLI and single-file components",
            "Build a todo app with Vue.js",
            "Create a full application with Vue Router and Vuex"
        ],
        "angular": [
            "Learn TypeScript fundamentals",
            "Master Angular components and services",
            "Learn dependency injection and RxJS",
            "Build a complete CRUD application",
            "Implement routing and guards"
        ],
        
        # Backend Frameworks
        "node.js": [
            "Master JavaScript and asynchronous programming",
            "Learn Node.js core modules and npm",
            "Build REST APIs with Express.js",
            "Connect to databases and handle authentication",
            "Deploy applications to cloud platforms"
        ],
        "django": [
            "Learn Python programming thoroughly",
            "Master Django models, views, and templates",
            "Build a blog or e-commerce site",
            "Implement user authentication and permissions",
            "Deploy Django applications"
        ],
        "flask": [
            "Learn Python basics and web development concepts",
            "Master Flask routing and templates",
            "Build RESTful APIs with Flask",
            "Implement database integration with SQLAlchemy",
            "Create and deploy a web application"
        ],
        "express.js": [
            "Learn Node.js fundamentals",
            "Master Express.js routing and middleware",
            "Build REST APIs with proper error handling",
            "Implement authentication and authorization",
            "Connect to databases and deploy applications"
        ],
        "spring boot": [
            "Learn Java and object-oriented programming",
            "Master Spring Boot fundamentals and annotations",
            "Build RESTful web services",
            "Implement data persistence with JPA",
            "Create microservices architecture"
        ],
        
        # Databases
        "sql": [
            "Learn database design and normalization",
            "Master SQL basics (SELECT, INSERT, UPDATE, DELETE)",
            "Practice complex queries with JOINs and subqueries",
            "Learn database indexing and performance optimization",
            "Work on real database projects"
        ],
        "mysql": [
            "Learn SQL fundamentals first",
            "Install and configure MySQL",
            "Practice database design and queries",
            "Learn MySQL-specific features and functions",
            "Build applications that use MySQL"
        ],
        "postgresql": [
            "Master SQL basics and advanced concepts",
            "Learn PostgreSQL-specific features",
            "Practice complex queries and stored procedures",
            "Implement database optimization techniques",
            "Build scalable applications with PostgreSQL"
        ],
        "mongodb": [
            "Learn NoSQL database concepts",
            "Master MongoDB operations and queries",
            "Learn data modeling for document databases",
            "Practice aggregation pipelines",
            "Build applications using MongoDB"
        ],
        
        # Cloud Platforms
        "aws": [
            "Learn cloud computing fundamentals",
            "Get AWS Cloud Practitioner certification",
            "Master core AWS services (EC2, S3, RDS)",
            "Build and deploy applications on AWS",
            "Learn AWS security and cost optimization"
        ],
        "azure": [
            "Learn Microsoft Azure fundamentals",
            "Master Azure core services and portal",
            "Deploy web applications to Azure",
            "Learn Azure DevOps and CI/CD",
            "Get Azure certification"
        ],
        "google cloud platform": [
            "Learn Google Cloud Platform basics",
            "Master core GCP services (Compute Engine, Cloud Storage)",
            "Deploy applications using App Engine",
            "Learn GCP data and ML services",
            "Build serverless applications"
        ],
        
        # DevOps Tools
        "docker": [
            "Learn containerization concepts",
            "Install Docker and learn basic commands",
            "Create Dockerfiles for applications",
            "Practice container orchestration",
            "Build CI/CD pipelines with Docker"
        ],
        "kubernetes": [
            "Learn Docker and containerization first",
            "Master Kubernetes architecture and concepts",
            "Practice deploying applications to clusters",
            "Learn Kubernetes networking and storage",
            "Implement monitoring and scaling"
        ],
        "git": [
            "Learn version control concepts",
            "Master basic Git commands and workflows",
            "Practice branching and merging strategies",
            "Contribute to open source projects",
            "Learn advanced Git features and best practices"
        ],
        
        # Frontend Technologies
        "html": [
            "Learn HTML5 semantic elements and structure",
            "Practice building accessible web pages",
            "Master forms and input validation",
            "Learn SEO best practices",
            "Build responsive layouts"
        ],
        "css": [
            "Learn CSS fundamentals and selectors",
            "Master layout techniques (Flexbox, Grid)",
            "Practice responsive design principles",
            "Learn CSS animations and transitions",
            "Build modern, beautiful user interfaces"
        ],
        "sass": [
            "Learn CSS fundamentals thoroughly",
            "Master Sass syntax and features",
            "Practice using variables and mixins",
            "Organize stylesheets with partials",
            "Build maintainable CSS architectures"
        ]
    }
    
    # Get specific roadmap or generate generic one
    if skill_lower in specific_roadmaps:
        return specific_roadmaps[skill_lower]
    
    # Try partial matching for variations
    for known_skill, roadmap in specific_roadmaps.items():
        if _skills_match_for_roadmap(skill_lower, known_skill):
            return roadmap
    
    # Generic roadmap for unknown skills
    return _generate_generic_roadmap(skill)


def _skills_match_for_roadmap(target_skill: str, known_skill: str) -> bool:
    """
    Check if target skill matches a known skill for roadmap purposes
    """
    # Direct match
    if target_skill == known_skill:
        return True
    
    # Common variations
    variations = {
        "js": "javascript",
        "ts": "typescript", 
        "py": "python",
        "react.js": "react",
        "reactjs": "react",
        "vue": "vue.js",
        "vuejs": "vue.js",
        "node": "node.js",
        "nodejs": "node.js",
        "express": "express.js",
        "expressjs": "express.js",
        "postgres": "postgresql",
        "mongo": "mongodb",
        "k8s": "kubernetes",
        "gcp": "google cloud platform",
        "aws": "aws",
        "html5": "html",
        "css3": "css",
        "scss": "sass"
    }
    
    return variations.get(target_skill) == known_skill


def _generate_generic_roadmap(skill: str) -> List[str]:
    """
    Generate a generic learning roadmap for unknown skills
    """
    skill_name = skill.title()
    
    return [
        f"Research {skill_name} fundamentals and use cases",
        f"Find quality tutorials and documentation for {skill_name}",
        f"Set up development environment for {skill_name}",
        f"Build a simple 'Hello World' project with {skill_name}",
        f"Create a more complex project showcasing {skill_name} features",
        f"Join {skill_name} community forums and contribute to discussions",
        f"Practice {skill_name} through coding challenges and exercises"
    ]


def get_estimated_learning_time(skill: str) -> str:
    """
    Get estimated learning time for a skill
    
    Args:
        skill: The skill name
        
    Returns:
        Estimated learning time string
    """
    skill_lower = skill.lower().strip()
    
    # Time estimates based on skill complexity
    time_estimates = {
        # Programming Languages (longer learning curve)
        "javascript": "4-6 weeks",
        "python": "6-8 weeks", 
        "java": "8-10 weeks",
        "c#": "8-10 weeks",
        "typescript": "2-3 weeks (after JavaScript)",
        
        # Frontend Frameworks
        "react": "3-4 weeks (after JavaScript)",
        "vue.js": "2-3 weeks (after JavaScript)",
        "angular": "4-5 weeks (after TypeScript)",
        
        # Backend Frameworks  
        "node.js": "3-4 weeks (after JavaScript)",
        "django": "4-5 weeks (after Python)",
        "flask": "2-3 weeks (after Python)",
        "express.js": "2-3 weeks (after Node.js)",
        "spring boot": "5-6 weeks (after Java)",
        
        # Databases
        "sql": "3-4 weeks",
        "mysql": "2-3 weeks (after SQL)",
        "postgresql": "2-3 weeks (after SQL)", 
        "mongodb": "2-3 weeks",
        
        # Cloud Platforms
        "aws": "6-8 weeks for basics",
        "azure": "6-8 weeks for basics",
        "google cloud platform": "6-8 weeks for basics",
        
        # DevOps Tools
        "docker": "2-3 weeks",
        "kubernetes": "4-6 weeks (after Docker)",
        "git": "1-2 weeks",
        
        # Frontend Technologies
        "html": "1-2 weeks",
        "css": "3-4 weeks",
        "sass": "1 week (after CSS)"
    }
    
    # Return estimate or default
    return time_estimates.get(skill_lower, "2-4 weeks")


def prioritize_skills_by_importance(missing_skills: List[str], role: str) -> List[str]:
    """
    Prioritize missing skills based on role importance
    
    Args:
        missing_skills: List of skills to prioritize
        role: Target job role
        
    Returns:
        Prioritized list of skills
    """
    if not missing_skills:
        return []
    
    # Role-based skill priorities
    role_priorities = {
        "frontend engineer": [
            "javascript", "react", "html", "css", "typescript", 
            "vue.js", "angular", "sass", "git"
        ],
        "backend engineer": [
            "python", "javascript", "node.js", "sql", "django", 
            "flask", "express.js", "postgresql", "mongodb", "git"
        ],
        "full stack engineer": [
            "javascript", "react", "node.js", "python", "sql",
            "html", "css", "git", "mongodb", "typescript"
        ],
        "devops engineer": [
            "docker", "kubernetes", "aws", "linux", "git",
            "python", "bash", "terraform", "ansible", "jenkins"
        ],
        "data scientist": [
            "python", "sql", "pandas", "numpy", "matplotlib",
            "jupyter", "git", "aws", "postgresql", "mongodb"
        ]
    }
    
    role_lower = role.lower()
    priority_order = role_priorities.get(role_lower, [])
    
    if not priority_order:
        return missing_skills
    
    # Sort missing skills by priority
    prioritized = []
    remaining = list(missing_skills)
    
    # Add skills in priority order
    for priority_skill in priority_order:
        for skill in remaining[:]:  # Copy to avoid modification during iteration
            if skill.lower() == priority_skill or _skills_match_for_roadmap(skill.lower(), priority_skill):
                prioritized.append(skill)
                remaining.remove(skill)
    
    # Add any remaining skills
    prioritized.extend(remaining)
    
    return prioritized