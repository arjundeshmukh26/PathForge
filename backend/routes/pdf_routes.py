"""
PDF processing routes for resume upload and text extraction.
"""
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.pdf_service import PDFService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/extract-pdf-text")
async def extract_pdf_text(
    file: UploadFile = File(..., description="PDF file to extract text from")
):
    """
    Extract text from uploaded PDF resume.
    
    Args:
        file: PDF file upload
        
    Returns:
        JSON response with extracted text and metadata
    """
    try:
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file format. Please upload a PDF file."
            )
        
        # Check file size (limit to 10MB)
        content = await file.read()
        await file.seek(0)  # Reset file pointer for processing
        
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=413, 
                detail="File too large. Please upload a PDF smaller than 10MB."
            )
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        logger.info(f"Processing PDF upload: {file.filename} ({len(content)} bytes)")
        
        # Extract text from PDF
        result = await PDFService.extract_text_from_pdf(file)
        
        if not result["success"]:
            raise HTTPException(
                status_code=422, 
                detail=f"Failed to extract text from PDF: {result.get('error', 'Unknown error')}"
            )
        
        # Validate extracted text
        validation = PDFService.validate_extracted_text(result["text"])
        
        if not validation["is_valid"]:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": validation["reason"],
                    "suggestions": validation["suggestions"],
                    "extracted_text": result["text"][:500] + "..." if len(result["text"]) > 500 else result["text"],
                    "metadata": result["metadata"]
                }
            )
        
        # Success response
        response_data = {
            "success": True,
            "text": result["text"],
            "metadata": {
                **result["metadata"],
                "validation": validation
            },
            "message": f"Successfully extracted {validation.get('word_count', 0)} words from PDF"
        }
        
        logger.info(f"Successfully processed PDF {file.filename}: "
                   f"{len(result['text'])} characters extracted")
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing PDF {file.filename if file else 'unknown'}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your PDF. Please try again."
        )

@router.post("/validate-pdf")
async def validate_pdf_content(
    file: UploadFile = File(..., description="PDF file to validate")
):
    """
    Validate PDF file without full text extraction (quick check).
    
    Args:
        file: PDF file upload
        
    Returns:
        JSON response with validation results
    """
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        content = await file.read()
        
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")
        
        # Quick validation - just check if it's a valid PDF
        try:
            import PyPDF2
            import io
            
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            page_count = len(pdf_reader.pages)
            
            if page_count == 0:
                raise HTTPException(status_code=422, detail="PDF appears to be empty")
            
            # Try to extract text from first page to see if it's readable
            first_page = pdf_reader.pages[0]
            sample_text = first_page.extract_text()
            
            has_text = len(sample_text.strip()) > 10
            
            return {
                "success": True,
                "valid": True,
                "metadata": {
                    "filename": file.filename,
                    "file_size": len(content),
                    "page_count": page_count,
                    "has_extractable_text": has_text,
                    "sample_text_length": len(sample_text)
                }
            }
            
        except Exception as e:
            logger.error(f"PDF validation failed for {file.filename}: {e}")
            raise HTTPException(
                status_code=422, 
                detail="Invalid or corrupted PDF file"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error validating PDF: {e}")
        raise HTTPException(status_code=500, detail="Error validating PDF file")