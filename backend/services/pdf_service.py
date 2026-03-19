"""
PDF text extraction service for resume processing.
"""
import io
import logging
from typing import Dict, Any
import PyPDF2
import pdfplumber
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class PDFService:
    """Service for extracting text from PDF files."""
    
    @staticmethod
    def extract_text_with_pypdf2(pdf_file: io.BytesIO) -> str:
        """
        Extract text using PyPDF2 library.
        
        Args:
            pdf_file: BytesIO object containing PDF data
            
        Returns:
            Extracted text string
        """
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_parts = []
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_parts.append(page_text.strip())
                        logger.debug(f"Extracted {len(page_text)} characters from page {page_num + 1}")
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")
                    continue
            
            full_text = '\n\n'.join(text_parts)
            logger.info(f"PyPDF2 extracted {len(full_text)} total characters from {len(pdf_reader.pages)} pages")
            return full_text
            
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed: {e}")
            return ""
    
    @staticmethod
    def extract_text_with_pdfplumber(pdf_file: io.BytesIO) -> str:
        """
        Extract text using pdfplumber library (better for complex layouts).
        
        Args:
            pdf_file: BytesIO object containing PDF data
            
        Returns:
            Extracted text string
        """
        try:
            text_parts = []
            pdf_file.seek(0)  # Reset file pointer
            
            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text_parts.append(page_text.strip())
                            logger.debug(f"Extracted {len(page_text)} characters from page {page_num + 1}")
                    except Exception as e:
                        logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")
                        continue
            
            full_text = '\n\n'.join(text_parts)
            logger.info(f"pdfplumber extracted {len(full_text)} total characters from {len(pdf.pages)} pages")
            return full_text
            
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")
            return ""
    
    @classmethod
    async def extract_text_from_pdf(cls, file: UploadFile) -> Dict[str, Any]:
        """
        Extract text from uploaded PDF file using multiple methods.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        try:
            # Validate file type
            if not file.content_type == 'application/pdf':
                raise ValueError(f"Invalid file type: {file.content_type}. Expected application/pdf")
            
            # Read file content
            content = await file.read()
            if not content:
                raise ValueError("Empty file uploaded")
            
            # Create BytesIO object for processing
            pdf_file = io.BytesIO(content)
            
            # Try pdfplumber first (generally better results)
            extracted_text = cls.extract_text_with_pdfplumber(pdf_file)
            extraction_method = "pdfplumber"
            
            # If pdfplumber fails or returns minimal text, try PyPDF2
            if not extracted_text or len(extracted_text.strip()) < 50:
                logger.info("pdfplumber extraction insufficient, trying PyPDF2...")
                pdf_file.seek(0)
                pypdf2_text = cls.extract_text_with_pypdf2(pdf_file)
                
                if len(pypdf2_text.strip()) > len(extracted_text.strip()):
                    extracted_text = pypdf2_text
                    extraction_method = "PyPDF2"
                else:
                    extraction_method = "pdfplumber (fallback)"
            
            # Clean up the extracted text
            cleaned_text = cls.clean_extracted_text(extracted_text)
            
            # Prepare response
            result = {
                "success": True,
                "text": cleaned_text,
                "metadata": {
                    "filename": file.filename,
                    "file_size": len(content),
                    "extraction_method": extraction_method,
                    "original_length": len(extracted_text),
                    "cleaned_length": len(cleaned_text),
                    "character_count": len(cleaned_text.replace(' ', '')),
                    "word_count": len(cleaned_text.split()),
                    "line_count": len(cleaned_text.split('\n'))
                }
            }
            
            logger.info(f"Successfully extracted text from {file.filename}: "
                       f"{result['metadata']['word_count']} words, "
                       f"{result['metadata']['cleaned_length']} characters")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file.filename}: {e}")
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "metadata": {
                    "filename": file.filename if file else "unknown",
                    "extraction_method": "failed"
                }
            }
    
    @staticmethod
    def clean_extracted_text(text: str) -> str:
        """
        Clean and normalize extracted PDF text.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text string
        """
        if not text:
            return ""
        
        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Remove excessive whitespace while preserving structure
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Strip whitespace from each line
            clean_line = line.strip()
            
            # Skip empty lines but preserve some structure
            if clean_line:
                cleaned_lines.append(clean_line)
            elif cleaned_lines and cleaned_lines[-1]:  # Keep one empty line for separation
                cleaned_lines.append('')
        
        # Join lines back together
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove excessive consecutive newlines (more than 2)
        import re
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        
        # Remove weird characters that sometimes appear in PDFs
        cleaned_text = re.sub(r'[^\x00-\x7F]+', '', cleaned_text)  # Remove non-ASCII
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)  # Normalize spaces
        cleaned_text = cleaned_text.replace('\n ', '\n')  # Remove spaces at line starts
        
        return cleaned_text.strip()

    @staticmethod
    def validate_extracted_text(text: str) -> Dict[str, Any]:
        """
        Validate if extracted text looks like a valid resume.
        
        Args:
            text: Extracted text to validate
            
        Returns:
            Dictionary with validation results and suggestions
        """
        if not text or len(text.strip()) < 50:
            return {
                "is_valid": False,
                "reason": "Text too short or empty",
                "suggestions": ["Please ensure the PDF contains readable text", "Try a different PDF file"]
            }
        
        # Check for common resume indicators
        text_lower = text.lower()
        resume_indicators = [
            'experience', 'education', 'skills', 'work', 'employment',
            'qualification', 'certificate', 'degree', 'university',
            'company', 'position', 'role', 'responsibilities', 'achievements'
        ]
        
        found_indicators = sum(1 for indicator in resume_indicators if indicator in text_lower)
        
        if found_indicators < 3:
            return {
                "is_valid": False,
                "reason": "Text doesn't appear to be a resume",
                "suggestions": [
                    "Please ensure the PDF is a resume/CV",
                    "Check if the PDF has selectable text (not just an image)"
                ]
            }
        
        word_count = len(text.split())
        if word_count < 100:
            return {
                "is_valid": False,
                "reason": "Resume appears too short",
                "suggestions": ["Ensure the PDF contains complete resume content"]
            }
        
        return {
            "is_valid": True,
            "word_count": word_count,
            "indicators_found": found_indicators
        }