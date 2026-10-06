import os
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

class OptionSchema(BaseModel):
    text: str = Field(description="The text for the option.")
    is_correct: bool = Field(description="Whether this option is correct or not.")
    order: int = Field(description="The order index (0, 1, 2, ...)")

class TestCaseSchema(BaseModel):
    input_data: str = Field(description="The standard input data for the code.")
    expected_output: str = Field(description="The expected output from the code.")
    is_sample: bool = Field(description="True if this is a sample visible test case, False if it's hidden.")
    order: int = Field(description="The order index (0, 1, ...)")

class QuestionSchema(BaseModel):
    title: str = Field(description="A short descriptive title for the question.")
    text: str = Field(description="The main text/description/problem statement of the question. Use markdown.")
    question_type: str = Field(description="Must be exactly one of: MCQ, MSQ, SUBJECTIVE, CODING")
    difficulty: str = Field(description="Must be exactly one of: EASY, MEDIUM, HARD")
    topic: str = Field(description="The subject or topic (e.g., Python, Mathematics).")
    marks: int = Field(description="Marks for the question. Between 1 to 20.")
    starter_code: str = Field(default="", description="Starter code if this is a CODING question, else an empty string.")
    options: List[OptionSchema] = Field(default_factory=list, description="List of options if question_type is MCQ or MSQ, else an empty list.")
    test_cases: List[TestCaseSchema] = Field(default_factory=list, description="List of test cases if question_type is CODING, else an empty list.")

class QuestionListSchema(BaseModel):
    questions: List[QuestionSchema] = Field(description="A list of generated questions.")

def generate_questions(prompt_instructions: str, count: int, question_type: str, difficulty: str, topic: str, option_variance: str) -> dict:
    from dotenv import load_dotenv
    load_dotenv()
    os.environ["GOOGLE_API_KEY"] = os.environ.get("GEMINI_API_KEY", "")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        temperature=0.7,
        max_retries=2,
    )
    
    structured_llm = llm.with_structured_output(QuestionListSchema)
    
    prompt = PromptTemplate.from_template(
        """You are an expert educator and exam creator. Generate {count} high-quality questions based on the criteria below.
        
Topic: {topic}
Question Type: {question_type}
Difficulty: {difficulty}
Option Similarity/Variance: {option_variance}
Additional Instructions from Teacher: {prompt_instructions}

Rules for Questions:
- If type is MCQ, exactly ONE option must have is_correct=True. Provide at least 4 options.
- If type is MSQ (Multiple Select Question), AT LEAST ONE option must be correct (usually more). Provide at least 4 options.
- If type is CODING, provide NO options. Instead, provide at least 3 test_cases, and provide python starter_code if helpful.
- If type is SUBJECTIVE, provide NO options and NO test_cases.
- Ensure the formatting in 'text' uses clean markdown if there's code or math.
- The 'topic' field should be set to {topic}.
- Pay strict attention to the Option Similarity constraint. If asked for similar options, make the distractors very tricky. If different, make them clearly distinct.
"""
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "count": count,
        "topic": topic,
        "question_type": question_type,
        "difficulty": difficulty,
        "option_variance": option_variance,
        "prompt_instructions": prompt_instructions,
    })
    
    return result.dict()
